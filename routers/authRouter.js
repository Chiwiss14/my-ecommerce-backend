const express = require('express');
const authController = require('../controllers/authController'); // Import your auth controller
const router = express.Router();

router.post('/signup',authController.signup ) // Import the signup controller function
router.post('/signin', authController.signin); // Import the sign controller function
router.post('/signout',identifier,authController.signout); // Import the forgot password controller function
router.patch('/send-verification-code',identifier,authController.sendVerificationCode);
 

router.patch('/change-password',identifier,authController.changePassword); 

router.patch('/send-forgot-password-code',authController.sendForgotPasswordCode); 
router.patch('/reset-password',authController.resetPassword); 




module.exports = router;
