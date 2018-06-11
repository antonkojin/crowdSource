var express = require('express');
var router = express.Router();
const db = require('../lib/db');
const bcrypt = require('bcrypt');

router.get('/signup', function (req, res) {
  res.render('signup');
});

router.post('/signup', async function (req, res) {
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
    res.redirect(302, '/login');
  } catch (error) {
    if (error.code == db.errorCodes.unique_violation) {
      res.redirect('/login', 409);
    } else {
      console.error(error);
      res.sendStatus(500);
    }
  }
});


router.get('/login', function (req, res) {
  res.render('login', {
    title: 'Login'
  });
});

router.get('/keywords/suggestions/:userInput', async function (req, res, next) {
  const userInput = req.params.userInput;
  try {
    const keywords = await db.db.any(`
    SELECT description FROM keyword
    WHERE description LIKE '%\${userInput:raw}%'
    `, {
      userInput: userInput
    });
    res.json(keywords.map(k => k.description));
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});
  
module.exports = router;
