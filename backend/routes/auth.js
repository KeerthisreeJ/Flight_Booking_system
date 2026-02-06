const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { generateToken, sendTokenResponse } = require('../middleware/auth');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/email');
const crypto = require('crypto');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { firstName, lastName, email, phone, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const user = await User.create({
            firstName,
            lastName,
            email,
            phone,
            password,
            role: 'user'
        });

        // Send token response
        sendTokenResponse(user, 201, res, 'User registered successfully');

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user (Step 1 - Password verification)
 * @access  Public
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { email, password } = req.body;

        // Find user and include password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is locked
        if (user.isLocked) {
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            // Increment login attempts
            await user.incLoginAttempts();

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Reset login attempts on successful password verification
        await user.resetLoginAttempts();

        // Generate and send OTP for 2FA
        const otp = user.generateOTP();
        await user.save();

        // Send OTP via email
        await sendOTPEmail(user.email, otp, user.firstName);

        res.status(200).json({
            success: true,
            message: 'Password verified. OTP sent to your email.',
            requiresOTP: true,
            userId: user._id
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP (Step 2 - Multi-Factor Authentication)
 * @access  Public
 */
router.post('/verify-otp', [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { userId, otp } = req.body;

        // Find user with OTP details and populate crew profile if exists
        const user = await User.findById(userId)
            .select('+otp +otpExpiry')
            .populate('crewProfile', 'employeeId firstName lastName role');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify OTP
        const isOTPValid = user.verifyOTP(otp);

        if (!isOTPValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Clear OTP after successful verification
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.lastLogin = Date.now();
        await user.save();

        // Send token response (successful login)
        sendTokenResponse(user, 200, res, 'Login successful');

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying OTP',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP
 * @access  Public
 */
router.post('/resend-otp', [
    body('userId').notEmpty().withMessage('User ID is required')
], async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new OTP
        const otp = user.generateOTP();
        await user.save();

        // Send OTP via email
        await sendOTPEmail(user.email, otp, user.firstName);

        res.status(200).json({
            success: true,
            message: 'OTP resent successfully'
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resending OTP',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user details',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with this email'
            });
        }

        // Generate reset token
        const resetToken = user.getResetPasswordToken();
        await user.save();

        // Send reset email
        await sendPasswordResetEmail(user.email, resetToken, user.firstName);

        res.status(200).json({
            success: true,
            message: 'Password reset email sent'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending password reset email',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/auth/reset-password/:resetToken
 * @desc    Reset password
 * @access  Public
 */
router.put('/reset-password/:resetToken', [
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
], async (req, res) => {
    try {
        // Hash the token from URL
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resetToken)
            .digest('hex');

        // Find user with valid token
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        // Send token response
        sendTokenResponse(user, 200, res, 'Password reset successful');

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;
