var express = require('express');
var router = express.Router();
var db = require('../lib/db');
var { inspect } = require('util');

router.get('/verification', function (req, res, next) {
  res.render('requester-verification');
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
    INSERT INTO keyword (description)
    VALUES (\${description})
    ON CONFLICT DO NOTHING
    RETURNING id;
  `;
  const queryGetKeywordId = `
    SELECT keyword.id
    FROM keyword
    WHERE description = \${description};
  `;
  const insertResult = await (transaction.oneOrNone(queryInsertKeyword, keyword));
  if ( insertResult !== null ) {
    return insertResult.id;
  } else {
    const { id } = await (transaction.one(queryGetKeywordId, keyword));
    return id;
  }
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
  db.db.tx(async transaction => {
    // campaign -> task -> {choice, keyword -> task_keyword) the leafs are unresolved
    try {
      const campaignId = await insertCampaign(transaction, {
        name: req.body.name,
        majority_threshold: req.body.majority_threshold,
        workers_per_task: req.body.workers_per_task,
        start: req.body.start,
        end: req.body.end,
        apply_end: req.body.apply_end,
        requester: 1 // TODO: still don't want to imlement login? because of cookies and session and things?
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
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });
});

router.get('/campaigns', async function (req, res, next) {
  const requesterId = 1; // TODO: auth
  try {
    const campaigns = await db.db.any(`
    SELECT id, name FROM campaign WHERE requester = \${requester}
    `, {
      requester: requesterId
    });
    console.log({campaigns});
    res.render('requester-campaigns', {campaigns});
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

router.get('/report/:campaignId', async function (req, res, next) {
  const requesterId = 1; //TODO auth
  const campaignId = req.params.campaignId;
  try {
    // name, id, completed, ongoing, valid/executed, tasks with result if any 
    const campaignName = await db.db.one(`
      SELECT name FROM campaign WHERE id = \${campaign} AND requester = \${requester}
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

    //TODO: random solution
    const topTenWorkers = await db.db.any(`
      WITH worker_score AS (
        SELECT id, email, RANDOM() * (10 - 1) + 1 AS score
        FROM worker
      ) SELECT id, email
      FROM worker_score
      ORDER BY score DESC
      LIMIT 10
    `, {
      campaign: campaignId
    });

    const viewArgs = {
      id: campaignId,
      name: campaignName.name,
      completedTasks: completedAndOngoingTasks.completed_tasks,
      ongoingTasks: completedAndOngoingTasks.ongoing_tasks,
      validExecutedRate: validTasks.valid_tasks / completedAndOngoingTasks.completed_tasks,
      tasks: tasksReports,
      topTenWorkers: topTenWorkers
    };
    console.log(viewArgs);
    res.render('requester-campaign-report', viewArgs);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

module.exports = router;
