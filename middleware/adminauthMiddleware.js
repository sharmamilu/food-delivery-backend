const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Admin authentication middleware
 * Verifies JWT token, checks if user exists, and validates admin role
 */
const adminauthMiddleware = async (req, res, next) => {
  // 1. Check if authorization header exists
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No authorization header provided.",
      code: "NO_AUTH_HEADER",
    });
  }

  // 2. Check if header follows Bearer token format
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Invalid authorization format. Use 'Bearer <token>'.",
      code: "INVALID_AUTH_FORMAT",
    });
  }

  // 3. Extract token
  const token = authHeader.split(" ")[1];

  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
      code: "NO_TOKEN",
    });
  }

  try {
    // 4. Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Find user in database
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found or has been deleted.",
        code: "USER_NOT_FOUND",
      });
    }

    // 6. Check if user account is active
    if (user.accountStatus && user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.accountStatus}. Please contact administrator.`,
        code: "ACCOUNT_INACTIVE",
        status: user.accountStatus,
      });
    }

    // 7. Check if user has admin role
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Administrator privileges required.",
        code: "NOT_ADMIN",
        requiredRole: "admin",
        userRole: user.role,
      });
    }

    // 8. Attach user to request object
    req.user = {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions: user.permissions || [],
      isActive: user.isActive,
      lastLogin: user.lastLogin,
    };

    // 9. Update last activity timestamp (optional)
    if (process.env.TRACK_USER_ACTIVITY === "true") {
      await User.findByIdAndUpdate(user._id, {
        lastActiveAt: new Date(),
      });
    }

    // 10. Proceed to next middleware/controller
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
        code: "TOKEN_EXPIRED",
        expiredAt: error.expiredAt,
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
        code: "INVALID_TOKEN",
        details: error.message,
      });
    }

    if (error.name === "NotBeforeError") {
      return res.status(401).json({
        success: false,
        message: "Token not yet valid.",
        code: "TOKEN_NOT_ACTIVE",
        date: error.date,
      });
    }

    // Database or server errors
    console.error("Admin Auth Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication server error. Please try again later.",
      code: "AUTH_SERVER_ERROR",
    });
  }
};

module.exports = adminauthMiddleware;
