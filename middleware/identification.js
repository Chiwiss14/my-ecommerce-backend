// my-ecommerce-backend/middleware/identification.js
const jwt = require("jsonwebtoken");
const User = require("../models/usersModel"); // Assuming your User model is here. Adjust path if necessary.

exports.identifier = async (req, res, next) => { // <--- Added 'async' keyword here
    console.log("FLOW: Identifier middleware started.");
    let token = null;

    // 1. Try to get token from Authorization header (Standard Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(" ")[1];
    }
    // 2. If 'client' header indicates non-browser, and raw token is in Authorization header
    else if (req.headers.client === 'not-browser' && req.headers.authorization) {
        token = req.headers.authorization;
    }
    // 3. Fallback to cookies (typical for browser-based sessions)
    else if (req.cookies && req.cookies['Authorization']) {
        if (req.cookies['Authorization'].startsWith('Bearer ')) {
            token = req.cookies['Authorization'].split(" ")[1];
        } else {
            token = req.cookies['Authorization'];
        }
    }

    // console.log("DEBUG: Token value before verification:", token);
    // console.log("DEBUG: Raw Authorization Header:", req.headers.authorization);
    // console.log("DEBUG: Raw Cookies (if any):", req.cookies);

    if (!token) {
        console.log("FLOW: No token found. Returning 'User not authenticated'.");
        return res.status(401).json({
            success: false,
            message: "Unauthorized: No token provided or invalid format."
        });
    }

    console.log("FLOW: Token found. Proceeding to jwt.verify().");
    try {
        const jwtVerified = jwt.verify(token, process.env.JWT_SECRET);
        console.log("FLOW: JWT Verified successfully. Decoded data:", jwtVerified); // <--- NEW LOG

        // Fetch user from DB and attach to req.user (recommended for robust authentication)
        // Ensure your JWT payload contains the user's ID (e.g., as 'id' or 'userId')
        req.user = await User.findById(jwtVerified.userId); // Assuming 'userId' in your JWT payload

        if (!req.user) {
            console.log("FLOW: User not found in DB for the decoded token ID."); // <--- NEW LOG
            return res.status(401).json({ success: false, message: "User not found for this token." });
        }

        console.log("FLOW: User attached to req.user. Calling next()."); // <--- NEW LOG
        next(); // Call the next middleware or route handler

    } catch (error) {
        console.error("FLOW: Token verification failed (in catch block). Error:", error);
        let errorMessage = "Invalid or expired token";
        if (error.name === 'TokenExpiredError') {
            errorMessage = "Token has expired. Please login again.";
        } else if (error.name === 'JsonWebTokenError') {
            errorMessage = "Invalid token signature or malformed token. Please login again.";
        }
        return res.status(401).json({
            success: false,
            message: errorMessage
        });
    }
};