var express = require('express');
var router = express.Router();

router.get('/signup', function(req, res, next) {
    res.render('signup', {title: 'Requester signup'});
});

router.get('/login', function(req, res, next) {
    res.render('login', {title: 'Requester login'});
});

router.get('/verification', function(req, res, next) {
    res.render('requester-verification');
});

router.get('/new-campaign', function(req, res, next) {
    require('fs').readFile(require('path').join(__dirname, '../public/esempio_task.json'), 'utf8', (err, json) => {
        const tasks = JSON.parse(json);
        console.log(tasks);
        res.render('requester-campaign-creation', {tasks: tasks.tasks});
    });
});

module.exports = router;
