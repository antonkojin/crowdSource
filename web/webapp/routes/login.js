var express = require('express');
var router = express.Router();
var db = require('../lib/db');

router.get('/', function(req, res) {
  res.render('login');
});

router.post('/', function(req, res) {
  db.testQuery();
  db.login(req.body.email, req.body.password,
    () => res.send('logged in'),
    () => res.send('not logged in')
  );
});

module.exports = router;
