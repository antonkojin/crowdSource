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

async function insertCampaign(tx, campaign) {
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

  const campaignId = await tx.one(queryCampaign, campaign);
  return campaignId.id; 
};

function insertChoices(tx, choices) {
  const queryInsertChoice = `
    INSERT INTO choice (name, value, task) VALUES (\${name}, \${value}, \${task});
  `;
  return tx.batch(choices.map(choice => tx.none(queryInsertChoice, choice)));
};

async function insertTask(tx, task) {
  const queryInsertTask = `
    INSERT INTO task (name, context, campaign) VALUES
    (
      \${name},
      \${context},
      \${campaign}
    ) RETURNING id;
  `;
  const { id } = await tx.one(queryInsertTask, task);
  return id;
};

async function insertKeyword(tx, keyword) {
  //TODO: first check if keywork alredy present
  const queryInsertKeyword = `
    INSERT INTO keyword (description) VALUES (\${description}) RETURNING id;
  `;
  const { id } = await (tx.one(
    queryInsertKeyword,
    keyword
  ));
  return id;
};

function insertTaskKeyword(tx, {taskId, keywordId}) {
  const query = `
    INSERT INTO task_keyword(task, keyword)
    VALUES (\${taskId}, \${keywordId});
  `;
  const promise = tx.none(query, {taskId, keywordId})
  return promise;
};

router.post('/new-campaign', function (req, res) { // TODO
  db.db.tx(async tx => {
    // campaign -> task -> {choice, keyword -> task_keyword)
    try {
      const campaignId = await insertCampaign(tx, {
        name: req.body.name,
        majority_threshold: req.body.majority_threshold,
        workers_per_task: req.body.workers_per_task,
        start: req.body.start,
        end: req.body.end,
        apply_end: req.body.apply_end,
        requester: 1 // TODO: get user id
      });



      const promises = req.body.tasks.map(async task => {
        const taskId = await insertTask(tx, {
          name: task.name,
          context: task.context,
          campaign: campaignId
        });

        const taskKeywordPromises = task.keywords.map(async keyword => {
          const keywordId = await (insertKeyword(tx, {
            description: keyword
          }));
          const taskKeywordPromise = insertTaskKeyword(tx, {taskId, keywordId});
          return taskKeywordPromise;
        });

        const choicesPromise = insertChoices(tx,
          task.choices.map(choice => ({
            name: choice.name,
            value: choice.val,
            task: taskId
          }))
        );
        
        return tx.batch([
          tx.batch(taskKeywordPromises),
          choicesPromise
        ]);
      });
      
      await tx.batch(promises);
      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });
});

router.get('/:campaignId/report', function (req, res, next) {
  res.render('requester-campaign-report', { campaignId: req.params.campaignId });
});

router.get('/campaigns', function (req, res, next) {
  res.render('requester-campaigns');
});

module.exports = router;
