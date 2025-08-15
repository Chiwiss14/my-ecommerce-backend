require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const authRouter = require("./routers/authRouter"); // Assuming you have auth routes set up
const productRoutes = require("./routers/productRouter"); // Import product routes
const orderRoutes = require("./routers/orderRoutes");
const paymentRoute = require("./routers/paymentRoute");

const app = express();

// 2. Middleware setup
const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.234.48:3000",
  "https://my-ecommerce-frontend.onrender.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (process.env.NODE_ENV === "development") {
        return callback(null, true); // allow all in dev
      }
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(helmet()); // Basic security headers
app.use(cookieParser()); // For parsing cookies
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use("/uploads", express.static("uploads")); // Serve static files from the uploads directory

// 3. MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully!");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// 4. Routes

app.use("/api/auth", authRouter); // Use your auth routes here
app.get("/api", (req, res) => {
  res.json({ message: "Hello from server HERE" });
});

app.use("/api", productRoutes); // Prefix for product routes (e.g., /api/products, /api/admin/product)
app.use("/api", require("./routers/orderRoutes"));

app.use("/api", orderRoutes); // Use your order routes
app.use("/api/payment", paymentRoute); // Use your payment routes

// 5. Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
