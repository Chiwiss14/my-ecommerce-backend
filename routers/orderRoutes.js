// my-ecommerce-backend/routers/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { identifier } = require('../middleware/identification'); // Your authentication middleware
const { authorizeRoles } = require('../middleware/authorization'); // Your authorization middleware (for admin roles)

// --- User-Specific Order Routes ---

// Create a new order (requires user to be logged in)
router.post('/order/new', identifier, orderController.createOrder);

// Get details of a single order (only if it belongs to the logged-in user)
router.get('/order/:id', identifier, orderController.getSingleOrder);

// Get all orders for the logged-in user
router.get('/orders/me', identifier, orderController.myOrders);

// --- Admin-Specific Order Routes ---

// Get all orders in the system (requires admin role)
router.get('/admin/orders', identifier, authorizeRoles('admin'), orderController.getAllOrders);

// Get details of any single order (requires admin role)
router.get('/admin/order/:id', identifier, authorizeRoles('admin'), orderController.getSingleOrder); // Using the same controller, but admin has broader access

// Update order status (requires admin role)
router.put('/admin/order/:id', identifier, authorizeRoles('admin'), orderController.updateOrderStatus);

// Delete an order (requires admin role)
router.delete('/admin/order/:id', identifier, authorizeRoles('admin'), orderController.deleteOrder);

module.exports = router;