const express = require('express');
const userStatsController = require('../controllers/statistics/userStatsController');
const docStatsController = require('../controllers/statistics/docStatsController');
const protectController = require('../controllers/authentication/protect');

const router = express.Router();

router.use(protectController.protect);
router.use(protectController.restrictTo('admin', 'editor'));

router.get('/getUsersStats', userStatsController.getUsersStats);
router.get('/getDocsStats', docStatsController.getDocsStats);

module.exports = router;
