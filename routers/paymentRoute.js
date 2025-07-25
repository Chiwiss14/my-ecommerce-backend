// my-ecommerce-backend/routes/paymentRoute.js

const express = require('express');
const { initializePayment } = require('../controllers/paymentController');
const { identifier } = require('../middleware/identification'); // Your authentication middleware
const { verifyPayment } = require('../controllers/paymentController'); // Import the verifyPayment function

const router = express.Router();

// Route to initialize a Paystack payment
// Requires authentication as payment is tied to a user
router.post('/checkout', identifier, initializePayment);
router.get('/verify-paystack', verifyPayment); 


module.exports = router;