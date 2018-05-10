var router = require('express').Router();
var db = require('../lib/db');
const {inspect} = require('util');

async function getAppliableOngoingAndCompletedCampagns(workerId) {
  const appliable = await (db.db.any(`
    SELECT * FROM
    campaign
    WHERE apply_end > CURRENT_TIMESTAMP
    AND id NOT IN (
      SELECT campaign FROM
      worker_campaign
      WHERE worker = $\{worker} 
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
    WITH completed_tasks AS (
      SELECT task.id, task.campaign
      FROM worker_choice 
      JOIN choice ON choice.id = worker_choice.choice
      JOIN task ON task.id = choice.task
      WHERE worker_choice.worker = \${worker}
    ) SELECT campaign.id, campaign.name
      FROM campaign
      JOIN task ON task.campaign = campaign.id
      JOIN worker_campaign ON worker_campaign.campaign = campaign.id
      WHERE task.id NOT IN (SELECT id FROM completed_tasks)
      AND worker_campaign.worker = \${worker}
      GROUP BY campaign.id
  `, {
    worker: workerId
  }));
  console.log(ongoing);
  // completed = applied - ongoing
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
        worker_campaign.score AS valid_tasks
      FROM worker_campaign
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
    ) SELECT e.campaign_id, e.campaign_name, e.executed_tasks,
        v.valid_tasks, COALESCE(r.ranking, 1) AS ranking
      FROM executed_tasks AS e
      LEFT JOIN valid_tasks AS v ON e.campaign_id = v.campaign_id
      LEFT JOIN ranking AS r on v.campaign_id = r.campaign_id
  `, queryArgs);
    const campaignsReports = result;
    return {
      campaigns: campaignsReports
    };
};

router.get('/campaigns', async function (req, res, next) {
  const workerId = 1; //TODO: authentication
  try {
    const campaigns = await getAppliableOngoingAndCompletedCampagns(workerId);
    const reports = await getReports(workerId);
    res.render('worker-campaigns', { campaigns, reports });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

router.post('/campaigns/apply/:campaignId', async function (req, res, next) {
  const workerId = 1; //TODO: authentication
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
  const workerId = 1; //TODO: authentication
  const campaignId = req.params.campaignId;
  try {
    const resultTaskId = await db.db.one(`
      WITH done_tasks AS (
        SELECT choice.task FROM
        worker_choice JOIN choice
          ON worker_choice.choice = choice.id
        JOIN task
          ON choice.task = task.id
        WHERE worker_choice.worker = \${worker}
          AND task.campaign = \${campaign}
      ), tasks_keywords AS (
        -- only if  workerker applied to the campaign
        SELECT task.id AS task, task_keyword.keyword FROM
        task LEFT JOIN task_keyword
          ON task.id = task_keyword.task
        JOIN campaign
          ON campaign.id = task.campaign
        JOIN worker_campaign
          ON worker_campaign.campaign = \${campaign}
        WHERE task.campaign = \${campaign}
          AND worker_campaign.worker = \${worker}
          AND campaign.workers_per_task > (
            SELECT COUNT(worker) FROM worker_choice JOIN choice ON worker_choice.choice = choice.id WHERE choice.task = task.id
          )
        AND task.id NOT IN (SELECT * FROM done_tasks)
      ), worker_keywords AS (
        SELECT w.keyword, w.level FROM
        worker_attitude AS w
        WHERE w.worker = \${worker}
      ), task_keyword_levels AS (
        SELECT task, t.keyword, level FROM
        tasks_keywords AS t LEFT JOIN worker_keywords AS w
        ON t.keyword = w.keyword
        ORDER BY level
      ), tasks_keywords_statistics AS (
        SELECT task, count(level), SUM(level), MAX(level), MIN(level)
        FROM task_keyword_levels
        GROUP BY task
      ) SELECT task
        FROM tasks_keywords_statistics
        ORDER BY sum DESC LIMIT 1
    ;`, {
        worker: workerId,
        campaign: campaignId
      });
    const taskId = resultTaskId.task;

    const resultTask = await db.db.one(`
      SELECT id, name, context
      FROM task
      WHERE id = \${task}
    `, {
        task: taskId
      });

    const resultChoices = await db.db.many(`
      SELECT id, name, value
      FROM choice
      WHERE task = \${task}
    `, {
        task: taskId
      });
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
    console.log(task);

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
  const workerId = 1; //TODO: authentication
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
    } else if (error.code == db.errorCodes.queryResultErrorCodes.noData) {
      res.sendStatus(400);
    } else {
      console.error(error);
      res.sendStatus(500);
    }
  }
});

module.exports = router;
