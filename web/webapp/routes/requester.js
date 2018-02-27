var express = require('express');
var router = express.Router();

router.get('/verification', function(req, res, next) {
    res.render('requester-verification');
});

router.get('/new-campaign', function(req, res, next) {
    res.render('requester-campaign-creation');
});

router.get('/:campaignId/report', function(req, res, next) {
    res.render('requester-campaign-report', {campaignId: req.params.campaignId});
});

router.get('/campaigns', function(req, res, next) {
    res.render('requester-campaigns');
});

module.exports = router;
