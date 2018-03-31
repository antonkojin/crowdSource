var express = require('express');
var router = express.Router();
var db = require('../lib/db');

router.get('/', function(req, res) {
  res.render('signup');
});

router.post('/', function(req, res) {
  db.query(
    'INSERT INTO users (email, password) VALUES ($1, $2);',
    [req.body.email, req.body.password]
  )
    .then(result => {
      res.send(result);
    })
    .catch(error => {
      res.send('DB ERROR', error.stack);
    });
});

module.exports = router;
