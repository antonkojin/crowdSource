var express = require('express');
var router = express.Router();
var db = require('../lib/db');

router.get('/campaigns', async function (req, res, next) {
  const workerId = 2; //TODO: authentication
  try{
    const appliable = await(db.db.any(`
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
    console.log({appliable});
    
    const applied = await(db.db.any(`
      SELECT campaign.id, campaign.name FROM
      worker_campaign JOIN campaign
      ON campaign.id = worker_campaign.campaign
      WHERE worker_campaign.worker = \${worker};
    `, {
      worker: workerId
    }));
    console.log({applied});
    const campaigns = {applied, appliable};
    res.render('worker-campaigns', {campaigns});
  } catch (error) {
    console.error(error);
    res.send(500);
  }
});

router.post('/campaigns/apply/:campaignId', async function(req, res, next) {
  const workerId = 2; //TODO: authentication
  const campaignId = req.params.campaignId;
  try{
    const result = await(db.db.none(`
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

router.get('/campaign/:campaignId/task', async function(req, res, next) {
  const workerId = 2; //TODO: authentication
  const campaignId = req.params.campaignId;
  try {
    const resultTaskId = await db.db.one(` 
      WITH tasks_keywords AS (
        SELECT task_keyword.task, task_keyword.keyword FROM
        task JOIN task_keyword
        ON task.id = task_keyword.task
        WHERE task.campaign = \${campaign}
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
    
    res.render('worker-task', {task: task});
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

router.post('/campaign/:campaignId/task/:taskId/choice/', async function(req, res, next) {
  const workerId = 2; //TODO: authentication
  const campaignId = req.params.campaignId;
  const taskId = req.params.taskId;
  const choiceValue = req.body.choice;
  try {
    //TODO: check choice is in task and task is in campaign for worker
    await (db.db.none(`
      INSERT INTO worker_choice (worker, choice)
      (
        SELECT \${worker}, choice.id
        FROM choice
        WHERE task = \${task}
        AND value = \${value}
      )
    `, {
      worker: workerId,
      task: taskId,
      value: choiceValue
    }));

      res.redirect('/worker/campaigns');
  } catch (error) {
    if (error.code == db.errorCodes.unique_violation) {
      // res.location('/worker/campaigns').send();
      res.redirect('/worker/campaigns');
    } else {
      console.error(error);
      res.sendStatus(500);
    }
  }
});

module.exports = router;
