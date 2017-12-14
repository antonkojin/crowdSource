var express = require('express');
var router = express.Router();

router.get('/signup', function(req, res, next) {
    res.render('signup', {title: 'Requester signup'});
});

router.get('/login', function(req, res, next) {
    res.render('login', {title: 'Requester login'});
});

router.get('/verification', function(req, res, next) {
    res.render('requester-verification', {title: 'Requester verification'});
});

router.get('/new-campaign', function(req, res, next) {
    res.render('requester-campaign-creation', {title: 'Create campaign'});
});

router.get('/new-task', function(req, res, next) {
    res.render('requester-task-creation', {title: 'Create task'});
});

module.exports = router;
