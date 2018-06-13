var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../lib/db');

router.get('/login', function (req, res) {
  res.render('admin-login')
});

router.post('/login', async function (req, res) {
  const inputPassword = req.body.password;
  const { password: storedPassword } = await db.db.one('SELECT password FROM admin LIMIT 1');
  const passwordMatch = await bcrypt.compare(inputPassword, storedPassword);
  if (!passwordMatch) return res.redirect(403, 'login');
  req.session.user = {
    type: 'admin'
  };
  req.session.cookie.path = '/admin/'
  res.redirect('requesters');
});

router.use((req, res, next) => {
  console.log(req.session);
  if ( !req.session.user ) return res.redirect('login', 403);
  next();
});

router.get('/requesters', async function (req, res) {
  const requesters = await db.db.any(`
    SELECT id, email FROM requester WHERE verified = false
  `);
  res.render('admin-requesters', {requesters});
});

router.post('/verify/:requesterId', async function (req, res) {
  try {
    await db.db.none(`
      UPDATE requester SET verified = true WHERE id = \${requesterId}
    `, {
      requesterId: req.params.requesterId
    });
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

router.post('/new-password', async function (req, res) {
  const inputPassword = req.body.password;
  try {
    const passwordHash = await bcrypt.hash(inputPassword, await bcrypt.genSalt())
    await db.db.none(`
      UPDATE admin SET password = \${passwordHash}
    `, { passwordHash });
    await req.session.destroy();
    res.redirect('login');
  } catch (error) {
    next(error);
  }
});

router.get('/logout', function (req, res) {
  req.session.destroy(error => {
    if (error) res.sendStatus(500);
    else return res.redirect('login');
  });
});

  
module.exports = router;
