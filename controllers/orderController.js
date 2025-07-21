const Order = require('../models/orderModel');
const Product = require('../models/product.model.js'); // Assuming you have a Product model
const Transaction = require('../models/transactionModel'); // Assuming you have a Transaction model
// You'll import your Paystack utility here when we get to it:
// const paystackService = require('../utils/paystack');

// --- User Actions ---

// Create New Order
exports.createOrder = async (req, res, next) => {
    try {
        const {
            shippingInfo,
            orderItems,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentMethod // e.g., 'Card', 'COD'
        } = req.body;

        // Ensure user is authenticated (req.user will be populated by identifier middleware)
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: "User not authenticated." });
        }

        // 1. Check product stock before creating order
        // This is a crucial step to prevent ordering out-of-stock items
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product not found for item: ${item.name}` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${item.name}. Only ${product.stock} available.` });
            }
        }

        // Initialize paymentInfo status as pending
        const paymentInfo = {
            status: 'pending',
            method: paymentMethod // e.g., 'Card', 'COD'
            // 'id' will be added after transaction initiation/completion
        };

        const order = await Order.create({
            shippingInfo,
            orderItems,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentInfo,
            user: req.user._id, // Link to the authenticated user
            paidAt: paymentMethod === 'COD' ? new Date() : undefined, // For COD, consider it paid immediately or handle separately
            orderStatus: paymentMethod === 'COD' ? 'processing' : 'pending', // COD might go straight to processing
        });

        // 2. If it's an online payment (e.g., Paystack), initiate payment here
        // We'll add this specific Paystack logic in a later step
        // For now, if not COD, the order is created as 'pending'
        if (paymentMethod !== 'COD') {
            // Placeholder for Paystack initiation logic
            // You'd typically return a Paystack authorization URL/reference here
            // For now, just respond that order is created, payment pending
            return res.status(201).json({
                success: true,
                message: "Order placed successfully. Awaiting payment.",
                order,
                // Add Paystack initiation data here later
            });
        }

        // For COD, update product stock immediately
        for (const item of orderItems) {
            await updateStock(item.product, item.quantity);
        }

        res.status(201).json({
            success: true,
            message: "Order placed successfully (Cash on Delivery).",
            order,
        });

    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ success: false, message: "Failed to create order." });
    }
};

// Get Single Order Details (for the authenticated user)
exports.getSingleOrder = async (req, res, next) => {
    try {
        // Find the order by ID and ensure it belongs to the authenticated user
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
                                 .populate('user', 'name email') // Populate user details
                                 .populate('paymentInfo.id'); // Populate the linked Transaction

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found or you do not have access." });
        }

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        console.error("Error fetching single order:", error);
        res.status(500).json({ success: false, message: "Failed to fetch order details." });
    }
};

// Get All Orders for Logged In User
exports.myOrders = async (req, res, next) => {
    try {
        // Find all orders for the authenticated user
        const orders = await Order.find({ user: req.user._id }).populate('paymentInfo.id'); // Populate linked transaction

        res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ success: false, message: "Failed to fetch user orders." });
    }
};

// --- Admin Actions ---

// Get All Orders (Admin)
exports.getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.find()
                                 .populate('user', 'name email') // Populate user for admin view
                                 .populate('paymentInfo.id'); // Populate linked transaction

        let totalAmount = 0;
        orders.forEach(order => {
            totalAmount += order.totalPrice;
        });

        res.status(200).json({
            success: true,
            count: orders.length,
            totalAmount,
            orders,
        });
    } catch (error) {
        console.error("Error fetching all orders (Admin):", error);
        res.status(500).json({ success: false, message: "Failed to fetch all orders." });
    }
};

// Update Order Status (Admin) - e.g., processing -> shipped -> delivered
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Prevent changing status if order is already delivered or cancelled
        if (order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') {
            return res.status(400).json({ success: false, message: "Order has already been delivered or cancelled." });
        }

        // If status is changed to delivered, update stock (if not done on COD)
        if (req.body.status === 'shipped' || req.body.status === 'delivered') {
            // You might update stock here or at the point of order creation for online payments
            // Ensure stock is only updated once per order item
            // For now, let's update if the order isn't COD and moved to shipped/delivered
            if (order.paymentInfo.method !== 'COD' && order.orderStatus === 'pending' || order.orderStatus === 'processing') {
                 for (const item of order.orderItems) {
                    await updateStock(item.product, item.quantity);
                }
            }
        }

        order.orderStatus = req.body.status;

        // If order status is delivered, set deliveredAt timestamp
        if (req.body.status === 'delivered') {
            order.deliveredAt = new Date();
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: "Order status updated successfully.",
            order,
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Failed to update order status." });
    }
};

// Delete Order (Admin)
exports.deleteOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Consider implementing a soft delete or just marking as 'cancelled'
        // For a hard delete, ensure related transactions are handled if necessary
        await order.deleteOne(); // Or use order.remove()

        res.status(200).json({
            success: true,
            message: "Order deleted successfully."
        });
    } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).json({ success: false, message: "Failed to delete order." });
    }
};


// Helper function to update product stock (called internally by order controllers)
async function updateStock(productId, quantity) {
    const product = await Product.findById(productId);
    if (product) {
        product.stock -= quantity;
        await product.save({ validateBeforeSave: false }); // Skip validation if stock goes negative temporarily
    }
}