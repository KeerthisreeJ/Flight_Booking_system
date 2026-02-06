const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Booking = require('../models/Booking');

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get('/users', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password');

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/admin/bookings
 * @desc    Get all bookings (Admin only)
 * @access  Private/Admin
 */
router.get('/bookings', protect, authorize('admin'), async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });

    } catch (error) {
        console.error('Fetch all bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/admin/users/:userId/role
 * @desc    Update user role (Admin only)
 * @access  Private/Admin
 */
router.put('/users/:userId/role', protect, authorize('admin'), async (req, res) => {
    try {
        const { role } = req.body;

        if (!['guest', 'user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            user
        });

    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user role',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get system statistics (Admin only)
 * @access  Private/Admin
 */
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const confirmedBookings = await Booking.countDocuments({ bookingStatus: 'confirmed' });
        const cancelledBookings = await Booking.countDocuments({ bookingStatus: 'cancelled' });
        
        const totalRevenue = await Booking.aggregate([
            { $match: { paymentStatus: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalBookings,
                confirmedBookings,
                cancelledBookings,
                totalRevenue: totalRevenue[0]?.total || 0
            }
        });

    } catch (error) {
        console.error('Fetch stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete user (Admin only)
 * @access  Private/Admin
 */
router.delete('/users/:userId', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
});

module.exports = router;
