// my-ecommerce-backend/routes/paymentRoute.js

const express = require('express');
const { initializePayment } = require('../controllers/paymentController');
const { identifier } = require('../middleware/identification'); // Your authentication middleware

const router = express.Router();

// Route to initialize a Paystack payment
// Requires authentication as payment is tied to a user
router.post('/payment/checkout', identifier, initializePayment);

// Route for Paystack to redirect to after payment.
// This will be handled in the next step (verification).
// router.get('/payment/verify-paystack', verifyPayment);

module.exports = router;