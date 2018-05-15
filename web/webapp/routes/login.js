var express = require('express');
var router = express.Router();
var db = require('../lib/db');

router.get('/', function (req, res) {
  res.json(req.session);
  // res.render('login');
});

router.post('/', function (req, res) {
  db.db.one(
    'SELECT (CASE WHEN count(*) = 1 THEN TRUE ELSE FALSE END) FROM "user" WHERE email = $1 AND password = $2;',
    [req.body.email, req.body.password]
  ).then(result => {
    if (result.case === true) {
      res.send('LOGGED IN');
    } else {
      res.send('WRONG CREDENTIALS');
    }
  }).catch(error => {
    console.error(error);
    res.sendStatus(500);
  });
});

module.exports = router;
