const express = require('express');
const createDocumentController = require('../controllers/documents/createDocumentController');
const getDocumentController = require('../controllers/documents/getDocumentController');
const documentFunctionalityController = require('../controllers/documents/documentFunctionalityController');
const editDocumentController = require('../controllers/documents/editDocumentController');
const removeDocumentController = require('../controllers/documents/removeDocumentController');
const downloadDocumentController = require('../controllers/documents/downloadDocumentController');
const documentHistoryController = require('../controllers/documents/documentHistoryController');
const requestController = require('../controllers/requests/createRequest');
const protectController = require('../controllers/authentication/protect');

const router = express.Router();

router.use(protectController.protect);

router.get('/approvedDocuments', getDocumentController.getApprovedDocuments);

router.get(
    '/userHistoryReview',
    documentHistoryController.getUserHistoryReview
);

router.get('/:docId', getDocumentController.getDocument);

router.post('/searchDocument', documentFunctionalityController.searchDocument);

router.post('/createDocumentAccessRequest', requestController.createRequest);

router.patch('/download', downloadDocumentController.downloadDocument);

router.use(protectController.restrictTo('admin', 'editor'));

router.get('/', getDocumentController.getAllDocuments);
router.post(
    '/',
    createDocumentController.uploadFiles,
    createDocumentController.createDocument
);
router.patch(
    '/approvePublicAccess',
    documentFunctionalityController.approvePublicAccess
);
router.patch(
    '/forbidPublicAccess',
    documentFunctionalityController.forbidPublicAccess
);
router.patch('/deleteDocument', documentFunctionalityController.deleteDocument);
router.patch(
    '/editDocument',
    editDocumentController.uploadFiles,
    editDocumentController.editDocument
);

router.delete(
    '/removeDocument/:docId',
    removeDocumentController.removeDocument
);

module.exports = router;
