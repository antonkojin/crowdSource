var express = require('express');
var router = express.Router();
var db = require('../lib/db');

router.get('/', function(req, res) {
  res.render('login');
});

router.post('/', function(req, res) {
  db.query(
    'SELECT true FROM users WHERE email = $1 AND password = $2;',
    [req.body.email, req.body.password]
  ).then(
    result => res.json(result)
  ).catch(
    reason => res.send('DB ERROR')
  );
});

module.exports = router;
