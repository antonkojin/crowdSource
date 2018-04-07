var express = require('express');
var router = express.Router();
const db = require('../lib/db');
var { inspect } = require('util');

router.get('/', function (req, res) {
  res.render('signup');
});

router.post('/', function (req, res) {
  db.db.none(
    'INSERT INTO "user" (email, password) VALUES ($1, $2);',
    [req.body.email, req.body.password]
  ).then(() => {
    res.send('SIGNED UP');
  }).catch(error => {
    if (error.code == db.errorCodes.unique_violation) {
      res.send('ALREDY REGISTERED');
    } else {
      console.error(error);
      res.sendStatus(500);
    }
  });
});

module.exports = router;
