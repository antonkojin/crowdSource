var express = require('express');
var router = express.Router();

router.get('/signup', function(req, res, next) {
    res.render('signup', {title: 'Requester signup'});
});

router.get('/login', function(req, res, next) {
    res.render('login', {title: 'Requester login'});
});

module.exports = router;
