const express = require('express');
const authController = require('../controllers/authController'); // Import your auth controller
const router = express.Router();

router.post('/signup',authController.signup ) // Import the signup controller function
router.post('/signin', authController.signin); // Import the sign controller function
router.post('/signout', authController.signout); // Import the forgot password controller function
router.patch('/send-verification-code', authController.sendVerificationCode); // Import the send verification email controller function
 
router.patch('/verify-verification-code', authController.verifyVerificationCode); // Import the verify email controller function

module.exports = router;
