var express = require('express');
var router = express.Router();
const db = require('../lib/db');
const bcrypt = require('bcrypt');

router.get('/', function (req, res) {
  res.render('signup');
});

router.post('/', async function (req, res) {
  if (!['worker', 'requester'].includes(req.body.user)) return res.sendStatus(400); 
  try {
    const passwordHash = await bcrypt.hash(req.body.password, await bcrypt.genSalt());
    await db.db.none(
      'INSERT INTO "${userType:raw}" (email, password) VALUES (${email}, ${password});',
      {
        email: req.body.email,
        password: passwordHash,
        userType: req.body.user
      }
    );
    res.send('SIGNED UP');
  } catch (error) {
    if (error.code == db.errorCodes.unique_violation) {
      res.send('ALREDY REGISTERED');
    } else {
      console.error(error);
      res.sendStatus(500);
    }
  }
});

module.exports = router;
