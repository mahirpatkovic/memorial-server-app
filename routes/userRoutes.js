const express = require('express');
// const authController = require('../controllers/authController');
const loginController = require('../controllers/authentication/login');
const signupController = require('../controllers/authentication/signup');
const validateProfileController = require('../controllers/authentication/validateProfile');
const forgotPasswordController = require('../controllers/authentication/forgotPassword');
const isAuthenticatedController = require('../controllers/authentication/isAuthenticated');
const updatePasswordController = require('../controllers/authentication/updatePassword');
const protectController = require('../controllers/authentication/protect');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/signup', signupController.signup);
router.post('/login', loginController.login);
router.get('/logout', loginController.logout);

router.patch(
    '/validateProfile/:token',
    validateProfileController.validateProfile
);

router.patch(
    '/resendValidationEmail/:token',
    validateProfileController.resendProfileValidationMail
);

router.post('/forgotPassword', forgotPasswordController.forgotPassword);
router.patch('/resetPassword/:token', forgotPasswordController.resetPassword);
router.post('/findResetToken', forgotPasswordController.findResetToken);

router.use(protectController.protect);

router.post('/auth', isAuthenticatedController.isLoggedIn);
router.patch('/updateUserProfile', userController.updateUserProfile);
router.patch(
    '/updateUserPassword',
    updatePasswordController.updateUserPassword
);

router.use(protectController.restrictTo('admin'));

router.get('/', userController.getAllUsers);

router.patch('/deactivateUser', userController.deactivateUser);
router.patch('/activateUser', userController.activateUser);
router.patch('/userEditorAdd', userController.userEditorAdd);
router.patch('/userEditorRemove', userController.userEditorRemove);
router.delete('/:userId', userController.removeUser);

module.exports = router;
