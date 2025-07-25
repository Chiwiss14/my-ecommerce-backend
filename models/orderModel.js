const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    orderItems: [
        {
            // We'll keep product ID and quantity, and price.
            // Name and image can potentially be populated later from the product ID.
            product: {
                type: mongoose.Schema.ObjectId,
                ref: 'Product',
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            price: { // Price at the time of purchase for a single item
                type: Number,
                required: true,
            },
            // Removed 'name' and 'image' as required here for simplicity.
            // They can be added back or populated from the 'product' reference later.
        },
    ],
    shippingInfo: {
        // Keeping required for essential shipping, but you can make some optional if needed.
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        pinCode: { type: String, required: true },
        phoneNo: { type: String, required: true },
    },
    paymentInfo: {
        // Making id and method optional for easier testing (e.g., for Cash on Delivery)
        // You'd add more rigorous validation/requirements for a live payment gateway
        id: {
            type: String, // Changed to String for simpler external transaction ID
            // Removed ref to 'Transaction' for simplicity, assuming direct ID storage
            required: false, // Now optional
        },
        status: { // Status of the payment (e.g., 'paid', 'unpaid', 'failed')
            type: String,
            required: true, // Keeping status as required is good practice
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },
        method: { // How the user paid (e.g., 'Card', 'Bank Transfer', 'COD')
            type: String,
            required: false, // Now optional
            enum: ['Card', 'Bank Transfer', 'COD', 'Wallet'],
        },
    },
    itemsPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    taxPrice: { // Added taxPrice from your previous model, ensuring it's optional if not always present
        type: Number,
        default: 0,
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    deliveredAt: Date, // Optional date for delivery
}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Order', orderSchema);