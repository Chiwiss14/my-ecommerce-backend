// my-ecommerce-backend/controllers/paymentController.js

const Paystack = require("paystack-api")(process.env.PAYSTACK_SECRET_KEY);
const Order = require("../models/orderModel"); // Import your Order model

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
        message:
          "Amount, email, and orderId are required to initialize payment.",
      });
    }

    // Fetch the order to get the actual total amount and verify it
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    // Ensure the amount matches the order's total or handle discrepancies
    // For simplicity, we'll use the provided amount. In production, use order.totalPrice.
    // For Paystack, amount is in kobo (for NGN), so multiply by 100
    const paystackAmount = amount * 100; // Convert to kobo

    // Paystack transaction details
    const paymentDetails = {
      amount: paystackAmount,
      email: email, // Email of the customer
      currency: "NGN", // Assuming Nigerian Naira. Change if needed.
      callback_url: `${process.env.BASE_URL}/api/payment/verify-paystack`, // Your backend's verification endpoint
      metadata: {
        order_id: orderId, // Attach order ID to metadata for verification
        user_id: req.user.userId, // User ID from authenticated user
      },
    };

    const response = await Paystack.transaction.initialize(paymentDetails);

    if (response.status) {
      res.status(200).json({
        success: true,
        message: "Payment initialized successfully",
        data: response.data, // Contains authorization_url and access_code
      });
    } else {
      console.error("Paystack Initialization Error:", response.message);
      res.status(500).json({
        success: false,
        message:
          response.message || "Failed to initialize payment with Paystack.",
      });
    }
  } catch (error) {
    console.error("Error initializing payment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during payment initialization.",
    });
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.query; // Paystack sends the reference as a query parameter
    console.log("Verify Payment Endpoint Hit. Reference:", reference); // Log 1
    console.log("Query received:", req.query); // Add this

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Payment reference is missing.",
      });
    }

    // Call Paystack's verification API using the Paystack instance
    const response = await Paystack.transaction.verify(reference);

    if (response.status && response.data.status === "success") {
      const paystackData = response.data;
      const orderId = paystackData.metadata
        ? paystackData.metadata.order_id
        : null;

      // Find the order in your database
      const order = await Order.findById(orderId);

      if (!order) {
        console.error(
          "Verification Error: Order not found for reference:",
          reference
        );
        return res.status(404).json({
          success: false,
          message: "Order not found for this transaction.",
        });
      }

      // Important: Check if the amount paid matches the order total to prevent fraud
      // Paystack amount is in kobo, order.totalPrice is likely in naira
      const amountPaidInNaira = paystackData.amount / 100;

      if (amountPaidInNaira < order.totalPrice) {
        // Handle partial payment or fraud attempt
        order.paymentStatus = "partial_payment"; // Or a relevant status
        await order.save();
        console.warn(
          `Payment mismatch for order ${orderId}: Paid ${amountPaidInNaira}, Expected ${order.totalPrice}`
        );
        return res.status(400).json({
          success: false,
          message:
            "Amount paid does not match order total. Possible partial payment or fraud.",
        });
      }

      // Update order status in your database
      order.paymentStatus = "paid";
      order.paidAt = new Date(paystackData.paid_at); // Use Paystack's paid_at timestamp
      order.paymentInfo = {
        id: paystackData.id,
        reference: paystackData.reference,
        status: paystackData.status,
        channel: paystackData.channel,
        currency: paystackData.currency,
        amount: paystackData.amount, // Amount in kobo
        // Store more details if needed
      };

      await order.save();

      // Respond to Paystack's redirect (or your frontend)
      // You might want to redirect the user to a success page on your frontend here
      // e.g., res.redirect(`https://your-frontend.com/payment-success?reference=${reference}`);
      res.status(200).json({
        success: true,
        message: "Payment verified and order updated successfully",
        transaction: paystackData,
      });
    } else {
      // Payment was not successful or verification failed according to Paystack
      console.error("Paystack Verification Failed:", response.message);
      res.status(400).json({
        success: false,
        message: response.message || "Payment verification failed.",
      });
    }
  } catch (error) {
    console.error("Error during payment verification:", error);
    // If it's an Axios error from Paystack API call, log response data
    if (error.response && error.response.data) {
      console.error(
        "Paystack API Error Response (Verification):",
        error.response.data
      );
    }
    res.status(500).json({
      success: false,
      message: error.message || "Server error during payment verification.",
    });
  }
};
