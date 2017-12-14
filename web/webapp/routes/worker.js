var express = require('express');
var router = express.Router();

router.get('/signup', function(req, res, next) {
    res.render('signup', {title: 'Worker signup'});
});

router.get('/login', function(req, res, next) {
    res.render('login', {title: 'Worker login'});
});

module.exports = router;
