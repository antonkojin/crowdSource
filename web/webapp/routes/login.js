var express = require('express');
var router = express.Router();
var db = require('../lib/db');
var { inspect } = require('util');

router.get('/', function(req, res) {
  res.render('login');
});

router.post('/', function(req, res) {
  db.query(
    'SELECT (CASE WHEN count(*) = 1 THEN TRUE ELSE FALSE END) FROM users WHERE email = $1 AND password = $2;',
    [req.body.email, req.body.password]
  ).then(
    result => {
      console.log(result);
      res.send(inspect(result));
    }
  ).catch(
    reason => res.send('DB ERROR')
  );
});

module.exports = router;
