var router = require('express').Router();
var db = require('../lib/db');
const {inspect} = require('util');
const bcrypt = require('bcrypt');
const ordinal = require('ordinal');

async function getProfileKeywords(workerId) {
  return db.db.any(`
    SELECT k.description, wa.level
    FROM keyword AS k JOIN worker_attitude AS wa
    ON k.id = wa.keyword
    WHERE wa.worker = \${workerId}
    ORDER BY wa.level DESC
  `, {
    workerId
  });
};

async function getAppliableOngoingAndCompletedCampagns(workerId) {
  const appliable = await (db.db.any(`
    SELECT * FROM campaign
    WHERE apply_end > CURRENT_TIMESTAMP
    AND id NOT IN (
      SELECT campaign FROM
      worker_campaign
      WHERE worker = $\{worker}
    ) AND EXISTS (
      SELECT * FROM task
      WHERE task.campaign = campaign.id
      AND task.result IS NULL
    )
  `, {
    worker: workerId
  }));
  
  const applied = await (db.db.any(`
    SELECT campaign.id, campaign.name FROM
    worker_campaign JOIN campaign
    ON campaign.id = worker_campaign.campaign
    WHERE worker_campaign.worker = \${worker};
    `, {
      worker: workerId
  }));
  
  const ongoing = await (db.db.any(`
    SELECT * FROM campaign
    WHERE "end" > CURRENT_TIMESTAMP
    AND id IN (
      SELECT campaign FROM
      worker_campaign
      WHERE worker = $\{worker}
    ) AND EXISTS (
      SELECT * FROM task
      WHERE task.campaign = campaign.id
      AND task.result IS NULL
    )`, {
        worker: workerId
  }));
  const completed = applied.filter(a => ongoing.reduce((notContains, o) => notContains && !(a.id == o.id), true));
  return { completed, appliable, ongoing };
};

async function getReports(workerId) {
  const queryArgs = { worker: workerId }
  const result = await db.db.any(`
    WITH executed_tasks AS (
      SELECT campaign.name AS campaign_name,
      campaign.id AS campaign_id,
      COUNT(task.id) AS executed_tasks
      FROM worker_choice LEFT JOIN choice
      ON worker_choice.choice = choice.id
        LEFT JOIN task
        ON task.id = choice.task
        LEFT JOIN campaign
        ON campaign.id = task.campaign
        WHERE worker_choice.worker = \${worker}
        GROUP BY campaign.id
    ), valid_tasks AS (
      SELECT worker_campaign.campaign AS campaign_id,
      worker_campaign.score AS valid_tasks,
      campaign.name AS campaign_name
      FROM worker_campaign
      JOIN campaign ON worker_campaign.campaign = campaign.id
      WHERE worker_campaign.worker = \${worker}
    ), ranking AS (
      SELECT worker_campaign.campaign AS campaign_id,
      COUNT(worker_campaign.worker) + 1 AS ranking
      FROM worker_campaign
      WHERE worker <> \${worker}
      AND worker_campaign.score > (
          SELECT t.score FROM worker_campaign AS t WHERE t.worker = \${worker} AND t.campaign = worker_campaign.campaign
        )
      GROUP BY worker_campaign.campaign
    ) SELECT v.campaign_id, v.campaign_name,
      COALESCE(e.executed_tasks, 0) AS executed_tasks,
      COALESCE(v.valid_tasks, 0) AS valid_tasks,
      COALESCE(r.ranking, 1)::INTEGER AS ranking
      FROM valid_tasks AS v
      LEFT JOIN executed_tasks AS e ON v.campaign_id = e.campaign_id
      LEFT JOIN ranking AS r ON r.campaign_id = e.campaign_id
  `, queryArgs);
  result.forEach(e => e.ranking = ordinal(e.ranking));
  const campaignsReports = result;
  return {
    campaigns: campaignsReports
  };
};

router.post('/login', async function (req, res) {
  try {
    const {
      id: workerId,
      password: workerPassword
    }  = await db.db.one(`
      SELECT id, password
      FROM worker WHERE email = \${email}
      `, {
        email: req.body.email
    });
    const passwordMatch = await bcrypt.compare(req.body.password, workerPassword);
    if (!passwordMatch) return res.sendStatus(403);
    req.session.user = {
      id: workerId,
      type: 'worker'
    };
    req.session.cookie.path = '/worker/'
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
  if ( !req.session.user ) return res.redirect('/login', 403);
  next();
});

router.get('/logout', function (req, res) {
  req.session.destroy(error => {
    if (error) res.sendStatus(500);
    else return res.redirect('/login');
  });
});

router.get('/campaigns', async function (req, res, next) {
  const workerId = req.session.user.id;
  try {
    const campaigns = await getAppliableOngoingAndCompletedCampagns(workerId);
    const reports = await getReports(workerId);
    const profile_keywords = await getProfileKeywords(workerId);
    
    res.render('worker-campaigns', { campaigns, reports, profile_keywords });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

router.post('/campaigns/apply/:campaignId', async function (req, res, next) {
  const workerId = req.session.user.id;
  const campaignId = req.params.campaignId;
  try {
    const result = await (db.db.none(`
      INSERT INTO worker_campaign (worker, campaign) VALUES
      (\${worker}, \${campaign});
    `, {
        worker: workerId,
        campaign: campaignId
      }));
    res.sendStatus(200);
  } catch (error) {
    if (error.code == db.errorCodes.unique_violation) {
      res.sendStatus(409);
    } else if (error.code == db.errorCodes.foreign_key_violation) {
      res.sendStatus(404);
    } else {
      console.error(error);
      res.sendStatus(500);
    }
  }
});

router.get('/campaign/:campaignId/task', async function (req, res, next) {
  const workerId = req.session.user.id;
  const campaignId = req.params.campaignId;
  try {
    const result = await db.db.func('assign_task', [
      workerId,
      campaignId
    ]);
    const taskId = result[0].assign_task;
    console.log(taskId);
    const resultTask = await db.db.one(`
      SELECT id, name, context
      FROM task
      WHERE id = \${task}
    `, {
        task: taskId
      }
    );

    const resultChoices = await db.db.many(`
      SELECT id, name, value
      FROM choice
      WHERE task = \${task}
    `, {
        task: taskId
      }
    );
    const choices = resultChoices.map(choice => {
      return {
        id: choice.id,
        name: choice.name,
        value: choice.value,
        htmlRadioId: 'radio' + choice.id,
      };
    });


    const task = {
      id: resultTask.id,
      name: resultTask.name,
      context: resultTask.context,
      choices: choices,
      campaignId: campaignId
    };

    res.render('worker-task', { task: task });
  } catch (error) {
    if (error.code == db.errorCodes.queryResultErrorCodes.noData) {
      res.render('worker-no-more-tasks');
    } else {
      console.error(error);
      res.sendStatus(500);
    }
  }
});

router.post('/campaign/:campaignId/task/:taskId/choice/', async function (req, res, next) {
  const workerId = req.session.user.id;
  const campaignId = req.params.campaignId;
  const taskId = req.params.taskId;
  const choiceValue = req.body.choice;
  try {
    await (db.db.one(`
      INSERT INTO worker_choice (worker, choice)
      (
        SELECT worker_campaign.worker, choice.id FROM
        choice JOIN task
          ON task.id = choice.task
        JOIN worker_campaign
          ON task.campaign = worker_campaign.campaign 
        WHERE task.id = \${task}
        AND task.campaign = \${campaign}
        AND worker_campaign.worker = \${worker}
        AND choice.value = \${value}
        AND task.id NOT IN (
          SELECT choice.task FROM
          worker_choice JOIN choice ON choice.id = worker_choice.choice
          WHERE worker = \${worker}
        )
      ) RETURNING *
    `, {
        worker: workerId,
        campaign: campaignId,
        task: taskId,
        value: choiceValue
      }));

    res.redirect('/worker/campaigns');
  } catch (error) {
    if (error.code == db.errorCodes.unique_violation) {
      res.redirect('/worker/campaigns');
    } else if (error.code == db.errorCodes.queryResultErrorCodes.noData) { // not a valid choice, not valid campaign, not valid task
      res.sendStatus(400);
    } else {
      console.error(error);
      res.sendStatus(500);
    }
  }
});

module.exports = router;
