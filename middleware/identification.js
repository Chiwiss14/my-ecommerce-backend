const jwt = require("jsonwebtoken");

exports.identifier = (req, res, next) => {
    let token;
    if (req.headers.client==='not-browser') {
        token=req.headers.authorization
    } else {
        token=req.cookies['Authorization'];
    }

    if(!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized, no token provided"
        });
    }
    try {
        const userToken = token.split(" ")[1]; // Extract the token from the "Bearer <token>" format
        const jwtVerified = jwt.verify(userToken, process.env.JWT_SECRET);
        if(jwtVerified) {
            req.user = jwtVerified; // Attach the user information to the request object
            next(); // Call the next middleware or route handler
        } else {
            throw new Error("Invalid token");
        }
    } catch(error) {
        console.log(error);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}