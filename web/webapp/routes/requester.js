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

router.post('/new-campaign', function (req, res) {
  // TODO
  console.log(inspect(req.body));
  const query = 'SELECT * FROM "user" WHERE email = ${email};';
  const parameters = {email: 'wrong email'};
  db.db.none(query, parameters)
    .then(() => {
      res.sendStatus(200);
    })
    .catch(error => {
      console.error(error);
      res.sendStatus(500);
    });
});

router.get('/:campaignId/report', function (req, res, next) {
  res.render('requester-campaign-report', { campaignId: req.params.campaignId });
});

router.get('/campaigns', function (req, res, next) {
  res.render('requester-campaigns');
});

module.exports = router;
