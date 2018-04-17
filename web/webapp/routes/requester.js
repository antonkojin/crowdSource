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
  // TODO: not sure can do that or have to do this check in the database 
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
        requester: 1 // TODO: get user id
      });



      const promises = req.body.tasks.map(async task => {
        const taskId = await insertTask(transaction, {
          name: task.name,
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
            value: choice.val,
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

router.get('/:campaignId/report', function (req, res, next) {
  res.render('requester-campaign-report', { campaignId: req.params.campaignId });
});

router.get('/campaigns', function (req, res, next) {
  res.render('requester-campaigns');
});

module.exports = router;
