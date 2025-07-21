// my-ecommerce-backend/models/orderModel.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // Link to the user who placed the order
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // References your User model
        required: true,
    },
    // Array of items in the order
    orderItems: [
        {
            name: {
                type: String,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            price: { // Price at the time of purchase
                type: Number,
                required: true,
            },
            image: { // Main image URL for the product for display in order history
                type: String,
                required: true,
            },
            product: { // Link to the actual product in the Product model
                type: mongoose.Schema.ObjectId,
                ref: 'Product',
                required: true,
            },
        },
    ],
    // Shipping information for the order
    shippingInfo: {
        address: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: { // Or region/province
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
        pinCode: { // Zip/Postal code
            type: String,
            required: true,
        },
        phoneNo: {
            type: String,
            required: true,
        },
    },
    // Payment details summary
    paymentInfo: {
        // This could be the gateway's transaction ID, or a reference to your Transaction model ID
        // For simplicity, we can store gateway transaction ID directly here or link to our Transaction model
        // Linking to Transaction model is better for auditing.
        id: { // This will be the _id from your Transaction model
            type: mongoose.Schema.ObjectId,
            ref: 'Transaction', // References your Transaction model
            // Not required directly if you want to allow cash on delivery, but usually needed for online payments
        },
        status: { // Status of the payment (e.g., 'paid', 'unpaid', 'failed')
            type: String,
            required: true,
            enum: ['pending', 'paid', 'failed', 'refunded'], // Matches transaction status for consistency
            default: 'pending'
        },
        method: { // How the user paid (e.g., 'Card', 'Bank Transfer', 'COD')
            type: String,
            required: true,
            enum: ['Card', 'Bank Transfer', 'COD', 'Wallet'], // Add relevant payment methods
        },
    },
    // Amounts
    itemsPrice: { // Sum of prices of all items (Product price * Quantity)
        type: Number,
        required: true,
        default: 0,
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    totalPrice: { // Sum of itemsPrice + shippingPrice + taxPrice
        type: Number,
        required: true,
        default: 0,
    },
    // Order Status
    orderStatus: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    // Optional: Date when the order was delivered
    deliveredAt: Date,

    // Auto-generated timestamps for creation and last update
}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Order', orderSchema);