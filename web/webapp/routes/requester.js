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

router.post('/new-campaign', function (req, res) { // TODO
  var unresolved = [];
  
  const queryInsertTask = `
    INSERT INTO task (name, context, campaign) VALUES
    (
      \${name},
      \${context},
      \${campaign}
    ) RETURNING id;
  `;


  const queryInsertKeyword = `
    INSERT INTO keyword (description) VALUES (\${description});
  `;

  db.db.tx(async tx => {
    // campaign -> task -> {choice, keyword -> task_keyword)
    try {
      var unresolved = [];
      const campaignId = await insertCampaign(tx, {
        name: req.body.name,
        majority_threshold: req.body.majority_threshold,
        workers_per_task: req.body.workers_per_task,
        start: req.body.start,
        end: req.body.end,
        apply_end: req.body.apply_end,
        requester: 1 // TODO: get user id
      });

      const unresolvedChoicesPromises = req.body.tasks.map(async task => {
        const { taskId } = await (tx.one(queryInsertTask, {
            name: task.name,
            context: task.context,
            campaign: campaignId
        }));

        const unresolvedChoicesInserts = insertChoices(tx,
          task.choices.map(choice => ({
            name: choice.name,
            value: choice.val,
            task: taskId
          }))
        );
        
        return unresolvedChoicesInserts;
      });
      
      await tx.batch(unresolvedChoicesPromises);
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
