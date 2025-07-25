// my-ecommerce-backend/controllers/paymentController.js

const Paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);
const Order = require('../models/orderModel'); // Import your Order model

// Initialize a Paystack transaction
exports.initializePayment = async (req, res, next) => {
    try {
        // We'll require 'amount' and 'email' for the payment initialization
        // The email will come from req.user (authenticated user)
        // The amount will come from the order's totalPrice (from req.body or derived)

        const { amount, email, orderId } = req.body; // 'orderId' to link the payment to an existing order

        // Basic validation
        if (!amount || !email || !orderId) {
            return res.status(400).json({
                success: false,
                message: "Amount, email, and orderId are required to initialize payment."
            });
        }

        // Fetch the order to get the actual total amount and verify it
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }
        
        // Ensure the amount matches the order's total or handle discrepancies
        // For simplicity, we'll use the provided amount. In production, use order.totalPrice.
        // For Paystack, amount is in kobo (for NGN), so multiply by 100
        const paystackAmount = amount * 100; // Convert to kobo

        // Paystack transaction details
        const paymentDetails = {
            amount: paystackAmount,
            email: email, // Email of the customer
            currency: 'NGN', // Assuming Nigerian Naira. Change if needed.
            callback_url: `${process.env.BASE_URL}/api/payment/verify-paystack`, // Your backend's verification endpoint
            metadata: {
                order_id: orderId, // Attach order ID to metadata for verification
                user_id: req.user.userId, // User ID from authenticated user
            }
        };

        const response = await Paystack.transaction.initialize(paymentDetails);

        if (response.status) {
            res.status(200).json({
                success: true,
                message: "Payment initialized successfully",
                data: response.data // Contains authorization_url and access_code
            });
        } else {
            console.error("Paystack Initialization Error:", response.message);
            res.status(500).json({
                success: false,
                message: response.message || "Failed to initialize payment with Paystack."
            });
        }

    } catch (error) {
        console.error("Error initializing payment:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error during payment initialization."
        });
    }
};

// // We will add the verifyPayment function in the next step
// exports.verifyPayment = async (req, res, next) => {
//     // ... logic to verify transaction ...
// };