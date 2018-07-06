var express = require('express');
var router = express.Router();
var db = require('../lib/db');
var { inspect } = require('util');
const bcrypt = require('bcrypt');

router.get('/verification', function (req, res, next) {
  res.render('requester-verification');
});

router.post('/login', async function (req, res) {
  try {
    const requester = await db.db.one(`
      SELECT id, password, verified
      FROM requester WHERE email = \${email}
    `, {
      email: req.body.email
    });
    if (requester.verified == false) return res.redirect(200, 'verification');
    const passwordMatch = await bcrypt.compare(req.body.password, requester.password);
    if (!passwordMatch) return res.redirect(403, '/login'); 
    req.session.user = {
      id: requester.id,
      type: 'requester'
    };
    req.session.cookie.path = '/requester/'
    console.log(req.session);
    res.redirect('campaigns');
  } catch(error) {
    if (error.code == db.errorCodes.queryResultErrorCodes.noData) {
      res.redirect('/login', 403);
    } else {
      console.error(error);
      res.sendStatus(500);
    }
  }
});

router.use((req, res, next) => {
  if ( !req.session.user ) return res.redirect(403, '/login');
  next();
});

router.get('/logout', function (req, res) {
  req.session.destroy(error => {
    if (error) res.sendStatus(500);
    else return res.redirect('/login');
  });
});

router.get('/new-campaign', function (req, res, next) {
  res.render('requester-campaign-creation');
});

async function insertCampaign(transaction, campaign) {
  const queryCampaign = `
    INSERT INTO campaign (name, majority_threshold, workers_per_task, "start", "end", apply_end, requester) VALUES
    (
        \${name},
        \${majority_threshold},
        \${workers_per_task},
        \${start},
        \${end},
        \${apply_end},
        \${requester}  
    ) RETURNING id;
  `;

  const campaignId = await transaction.one(queryCampaign, campaign);
  return campaignId.id; 
};

function insertChoices(transaction, choices) {
  const queryInsertChoice = `
    INSERT INTO choice (name, value, task) VALUES (\${name}, \${value}, \${task});
  `;
  return transaction.batch(choices.map(choice => 
    transaction.none(queryInsertChoice, choice)
  ));
};

async function insertTask(transaction, task) {
  const queryInsertTask = `
    INSERT INTO task (name, context, campaign) VALUES
    (
      \${name},
      \${context},
      \${campaign}
    ) RETURNING id;
  `;
  const { id } = await transaction.one(queryInsertTask, task);
  return id;
};

async function insertKeyword(transaction, keyword) {
  const queryInsertKeyword = `
    WITH sel AS (
      SELECT keyword.id
      FROM keyword
      WHERE description = \${description}  
    ),
    ins AS (
      INSERT INTO keyword (description)
      VALUES (\${description})
      ON CONFLICT DO NOTHING
      RETURNING id
    )
    SELECT id FROM sel
    UNION ALL
    SELECT id FROM ins
  `;
  const queryGetKeywordId = `
    SELECT keyword.id
    FROM keyword
    WHERE description = \${description}
  `;

    var result;
    try {
      result = await (transaction.one(queryInsertKeyword, keyword));
    } catch(error) {
      if (error.code == db.errorCodes.queryResultErrorCodes.noData) {
        result = await (transaction.one(queryGetKeywordId, keyword));
      }
    }
    return result.id;
};

function insertTaskKeyword(transaction, {taskId, keywordId}) {
  const query = `
    INSERT INTO task_keyword(task, keyword)
    VALUES (\${taskId}, \${keywordId});
  `;
  const promise = transaction.none(query, {taskId, keywordId})
  return promise;
};

router.post('/new-campaign', function (req, res) {
  db.db.tx(
    async transaction => {
    const requesterId = req.session.user.id;
    try {
      const campaignId = await insertCampaign(transaction, {
        name: req.body.name,
        majority_threshold: req.body.majority_threshold,
        workers_per_task: req.body.workers_per_task,
        start: req.body.start,
        end: req.body.end,
        apply_end: req.body.apply_end,
        requester: requesterId
      });

      const promises = req.body.tasks.map(async task => {
        const taskId = await insertTask(transaction, {
          name: task.title,
          context: task.context,
          campaign: campaignId
        });

        const taskKeywordPromises = task.keywords.map(async keyword => {
          const keywordId = await (insertKeyword(transaction, {
            description: keyword
          }));
          const taskKeywordPromise = insertTaskKeyword(transaction, {taskId, keywordId});
          return taskKeywordPromise;
        });

        const choicesPromise = insertChoices(transaction,
          task.choices.map(choice => ({
            name: choice.name,
            value: choice.value,
            task: taskId
          }))
        );
        
        return transaction.batch([
          transaction.batch(taskKeywordPromises),
          choicesPromise
        ]);
      });
      
      await transaction.batch(promises);
      res.sendStatus(200);
    } catch (error) {
      console.error(error.message);
      res.sendStatus(500);
    }
  });
});

router.get('/campaigns', async function (req, res, next) {
  const requesterId = req.session.user.id;
  try {
    const campaigns = await db.db.any(`
    SELECT id, name FROM campaign WHERE requester = \${requester}
    `, {
      requester: requesterId
    });
    res.render('requester-campaigns', {campaigns, title: 'Campaigns'});
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

router.get('/report/:campaignId', async function (req, res, next) {
  const requesterId = req.session.user.id;
  const campaignId = req.params.campaignId;
  try {
    const campaign = await db.db.one(`
      SELECT name, workers_per_task, majority_threshold FROM campaign WHERE id = \${campaign} AND requester = \${requester}
    `, {
      campaign: campaignId,
      requester: requesterId
    });
    
    const tasksReports = await db.db.any(`
      SELECT id, name AS title, result FROM task WHERE task.campaign = \${campaign}
    `, {
      campaign: campaignId
    });

    const completedAndOngoingTasks = await db.db.one(`
      SELECT COUNT(result) AS completed_tasks,
        COUNT(*) - COUNT(result) AS ongoing_tasks
        FROM task
        WHERE campaign = \${campaign}
    `, {
      campaign: campaignId
    });

    const validTasks = await db.db.one(`
      SELECT COUNT(*) AS valid_tasks
      FROM task
      WHERE campaign = \${campaign}
      AND result > 0
    `, {
      campaign: campaignId
    });

    const topTenWorkers = await db.db.any(`
      SELECT w.id, w.email, wc.score
      FROM worker AS w
      JOIN worker_campaign AS wc ON wc.worker = w.id
      WHERE wc.campaign = \${campaign}
      ORDER BY wc.score DESC
      LIMIT 10
    `, {
      campaign: campaignId
    });



    const viewArgs = {
      id: campaignId,
      name: campaign.name,
      workers_per_task: campaign.workers_per_task,
      majority_threshold: campaign.majority_threshold,
      completedTasks: completedAndOngoingTasks.completed_tasks,
      ongoingTasks: completedAndOngoingTasks.ongoing_tasks,
      validTasks: validTasks.valid_tasks,
      tasks: tasksReports,
      topTenWorkers: topTenWorkers
    };
    res.render('requester-campaign-report', viewArgs);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

module.exports = router;
