const express = require('express');
const authController = require('../controllers/authController'); // Import your auth controller
const router = express.Router();

router.post('/signup',authController.signup ) // Import the signup controller function
router.post('/signin', authController.signin); // Import the sign controller function
router.patch('/send-verification-code', authController.sendVerificationEmail); // Import the send verification email controller function

module.exports = router;
