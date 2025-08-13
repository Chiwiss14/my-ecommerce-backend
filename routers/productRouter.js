const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { identifier } = require('../middleware/identification'); // Your auth middleware
const { authorizeRoles } = require('../middleware/authorization'); // Authorization middleware
// const upload = require("../middleware/upload");
const upload = require('../cloudinaryConfig');



// Public routes (users and admins can view)
router.get('/products', productController.getAllProducts);
router.get('/product/:id', productController.getProductDetails);

// After identifier middleware
router.put('/product/review', identifier, productController.createOrUpdateReview);
router.delete('/product/review', identifier, productController.deleteReview);


// Admin-only routes (protected)
router.post('/admin/product/new', identifier, authorizeRoles('admin'),upload.single("image"), productController.createProduct);
router.put('/admin/product/:id', identifier, authorizeRoles('admin'),upload.single("image"), productController.updateProduct);
router.delete('/admin/product/:id', identifier, authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;