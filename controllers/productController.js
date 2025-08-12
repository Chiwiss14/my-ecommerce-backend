const Product = require("../models/product.model");
const { productSchemaValidation } = require("../middleware/validator");
const mongoose = require("mongoose");

// ✅ Admin: Create New Product
exports.createProduct = async (req, res) => {
  try {
    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }

    // Validation with Joi
    const { error } = productSchemaValidation.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    // Add admin user ID to product
    req.body.user = req.user._id;

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create product." });
  }
};

exports.getAllProducts = async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;

    const filter = {};

    // Search by name or description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category) {
      filter.category = category.toLowerCase();
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch products." });
  }
};

exports.getProductDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID." });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch product details." });
  }
};

// ✅ Admin: Update Product
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    // Validation with Joi (optional for update)
    const { error } = productSchemaUpdateValidation.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update product." });
  }
};

// ✅ Admin: Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    await product.deleteOne(); // Or use soft delete if needed

    res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete product." });
  }
};

exports.createOrUpdateReview = async (req, res) => {
  try {
    const { rating, comment, productId } = req.body;
    const user = req.user;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const existingReviewIndex = product.reviews.findIndex(
      (rev) => rev.user.toString() === user.userId
    );

    if (existingReviewIndex !== -1) {
      // Update existing review
      product.reviews[existingReviewIndex].rating = rating;
      product.reviews[existingReviewIndex].comment = comment;
    } else {
      // Add new review
      const review = {
        user: user.userId,
        name: user.email,
        rating: Number(rating),
        comment,
      };
      product.reviews.push(review);
    }

    // Recalculate ratings and number of reviews
    product.numOfReviews = product.reviews.length;
    product.ratings =
      product.reviews.reduce((acc, rev) => acc + rev.rating, 0) /
      product.numOfReviews;

    await product.save();

    res
      .status(200)
      .json({ success: true, message: "Review submitted successfully" });
  } catch (error) {
    console.error("Error in review:", error);
    res
      .status(500)
      .json({ success: false, message: "Error submitting review" });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { productId } = req.query;
    const userId = req.user.userId;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    product.reviews = product.reviews.filter(
      (rev) => rev.user.toString() !== userId
    );

    product.numOfReviews = product.reviews.length;
    product.ratings =
      product.numOfReviews > 0
        ? product.reviews.reduce((acc, rev) => acc + rev.rating, 0) /
          product.numOfReviews
        : 0;

    await product.save();
    res
      .status(200)
      .json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ success: false, message: "Error deleting review" });
  }
};
