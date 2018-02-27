var express = require('express');
var router = express.Router();

router.get('/campaigns', function(req, res, next) {
    //TODO
    res.send('my campaigns and applyable campaigns');
});

router.get('/campaign/apply/:campaignId', function(req, res, next) {
    // res.send(req.params);
    //TODO
    res.send('applyed for a new campaign');
});

router.get('/campaign/:campaignId/task', function(req, res, next) {
    getTasksAnd( tasks => {
        const index = Math.floor(Math.random() * tasks.length);
        const task = tasks[index]
        res.render('worker-task', {task: task});
    });
});

let getTasksAnd = (fun) => {
    require('fs').readFile(
        require('path').join(__dirname, '../public/esempio_task.json'),
        'utf8',
        (err, json) => fun(JSON.parse(json).tasks)
    );
};


module.exports = router;
