var express = require('express');
var router = express.Router();
const db = require('../lib/db');

router.get('/', function (req, res) {
  res.render('signup');
});

router.post('/', function (req, res) {
  if (!['worker', 'requester'].includes(req.body.user)) return res.sendStatus(400); 
  db.db.none(
    'INSERT INTO "${userType:raw}" (email, password) VALUES (${email}, ${password});',
    {
      email: req.body.email,
      password: req.body.password,
      userType: req.body.user
    }
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
