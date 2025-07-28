// my-ecommerce-backend/routes/contactRoute.js

const express = require('express');
const { sendContactMessage } = require('../controllers/contactController');
const { validateContactMessage } = require('../middleware/validator'); // <--- IMPORT VALIDATION
const { identifier } = require('../middleware/identification');

const router = express.Router();

// Route for sending a contact message
// Place validation middleware before the controller function
router.post('/contact', validateContactMessage, sendContactMessage); 



module.exports = router;