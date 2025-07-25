exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Ensure user is authenticated and role is defined
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. User information not found."
            });
        }

        // Check if user's role is allowed
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Role '${req.user.role}' is not allowed to access this resource.`
            });
        }

        next(); // All good, proceed
    };
};
