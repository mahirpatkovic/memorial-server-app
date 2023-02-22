const express = require('express');
const createRequestController = require('../controllers/requests/createRequest');
const getRequestController = require('../controllers/requests/getRequests');
const approveRequestController = require('../controllers/requests/approveRequest');
const declineRequestController = require('../controllers/requests/declineRequest');
const protectController = require('../controllers/authentication/protect');

const router = express.Router();

router.use(protectController.protect);

router.post('/', createRequestController.createRequest);

router.use(protectController.restrictTo('admin', 'editor'));

router.get('/', getRequestController.getAllRequests);

router.patch('/approveRequest', approveRequestController.approveRequest);
router.patch('/declineRequest', declineRequestController.declineRequest);

module.exports = router;
