var express = require('express');
var router = express.Router();
var db = require('../lib/db');

router.get('/campaigns', async function(req, res, next) {
  //TODO
  res.sendStatus(555);
});


router.get('/campaigns/apply', async function(req, res, next) {
  const workerId = 2; //TODO: authentication
  try{
    const result = await (db.db.any(`
      SELECT * FROM
      campaign
      WHERE apply_end > CURRENT_TIMESTAMP
    `, {}));
    console.log(result);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.send(500);
  }
});

router.post('/campaigns/apply/:campaignId', function(req, res, next) {
  // res.send(req.params);
  //TODO
  res.send('applyed for a new campaign');
});

router.get('/campaign/:campaignId/task', async function(req, res, next) {
  const workerId = 2; //TODO: authentication

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
      campaign: req.params.campaignId
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
      choices: choices
    };
    console.log(task);
    
    res.render('worker-task', {task: task});
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

router.post('/campaign/:campaignId/task', async function(req, res, next) {
  res.send(555); //TODO
});

module.exports = router;
