const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Verify JWT token
 */
exports.protect = async (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route. Please login.'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by ID from token
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please login again.'
        });
    }
};

/**
 * Authorize roles - Check if user has required role
 * Usage: authorize('admin', 'user')
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }

        next();
    };
};

/**
 * Check if user owns the resource
 * Used for accessing own bookings, profile, etc.
 */
exports.checkOwnership = (resourceUserField = 'user') => {
    return (req, res, next) => {
        // Admin can access everything
        if (req.user.role === 'admin') {
            return next();
        }

        // For booking routes, check if user owns the resource
        if (req.resource && req.resource[resourceUserField]) {
            if (req.resource[resourceUserField].toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this resource'
                });
            }
        }

        next();
    };
};

/**
 * Generate JWT token
 */
exports.generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

/**
 * Send token response (cookie + JSON)
 */
exports.sendTokenResponse = (user, statusCode, res, message = 'Success') => {
    // Generate token
    const token = exports.generateToken(user._id);

    // Cookie options
    const options = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' // HTTPS in production
    };

    // Remove password from output
    user.password = undefined;

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            message,
            token,
            user
        });
};
