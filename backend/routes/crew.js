const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Crew = require('../models/Crew');
const Flight = require('../models/Flight');

/**
 * @route   GET /api/crew
 * @desc    Get all crew members (admin) or own profile (crew)
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
    try {
        // If user is crew, only return their own profile
        if (req.user.role === 'crew') {
            const crew = await Crew.findById(req.user.crewProfile)
                .populate('assignedFlights', 'flightNumber from to departureTime status');

            if (!crew) {
                return res.status(404).json({
                    success: false,
                    message: 'Crew profile not found'
                });
            }

            return res.status(200).json({
                success: true,
                crew: [crew] // Return as array for consistency
            });
        }

        // Admin can see all crew
        const { role, status } = req.query;

        let query = {};
        if (role) query.role = role;
        if (status) query.status = status;

        const crew = await Crew.find(query)
            .populate('assignedFlights', 'flightNumber from to')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: crew.length,
            crew
        });

    } catch (error) {
        console.error('Fetch crew error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching crew members',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/crew
 * @desc    Create new crew member with linked user account
 * @access  Private/Admin
 */
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const User = require('../models/User');

        // Check if user with this email already exists
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'A user with this email already exists'
            });
        }

        // Check if crew with this email already exists
        const existingCrew = await Crew.findOne({ email: req.body.email });
        if (existingCrew) {
            return res.status(400).json({
                success: false,
                message: 'A crew member with this email already exists'
            });
        }

        // Create crew member
        const crew = new Crew(req.body);
        await crew.save();

        // Generate temporary password
        const tempPassword = `Crew${Math.floor(100000 + Math.random() * 900000)}!`;

        // Create linked user account
        const user = await User.create({
            firstName: crew.firstName,
            lastName: crew.lastName,
            email: crew.email,
            phone: crew.phone,
            password: tempPassword,
            role: 'crew',
            crewProfile: crew._id
        });

        console.log(`✅ Created crew member and user account for ${crew.email}`);
        console.log(`   Employee ID: ${crew.employeeId}`);
        console.log(`   Temporary Password: ${tempPassword}`);

        res.status(201).json({
            success: true,
            message: 'Crew member and user account created successfully',
            crew,
            credentials: {
                email: crew.email,
                tempPassword: tempPassword,
                note: 'Please share these credentials securely with the crew member'
            }
        });

    } catch (error) {
        console.error('Create crew error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating crew member',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/crew/:id
 * @desc    Update crew member
 * @access  Private/Admin
 */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const crew = await Crew.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!crew) {
            return res.status(404).json({
                success: false,
                message: 'Crew member not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Crew member updated successfully',
            crew
        });

    } catch (error) {
        console.error('Update crew error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating crew member',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/crew/:id
 * @desc    Delete crew member
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const crew = await Crew.findById(req.params.id);

        if (!crew) {
            return res.status(404).json({
                success: false,
                message: 'Crew member not found'
            });
        }

        // Remove crew from assigned flights
        if (crew.assignedFlights.length > 0) {
            await Flight.updateMany(
                { _id: { $in: crew.assignedFlights } },
                {
                    $pull: {
                        'crew.cabinCrew': crew._id
                    },
                    $unset: {
                        'crew.pilot': crew.role === 'pilot' ? crew._id : undefined,
                        'crew.coPilot': crew.role === 'co-pilot' ? crew._id : undefined
                    }
                }
            );
        }

        await crew.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Crew member deleted successfully'
        });

    } catch (error) {
        console.error('Delete crew error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting crew member',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/crew/available
 * @desc    Get available crew members (not assigned or on leave)
 * @access  Private/Admin
 */
router.get('/available', protect, authorize('admin'), async (req, res) => {
    try {
        const { role } = req.query;

        let query = { status: 'active' };
        if (role) query.role = role;

        const crew = await Crew.find(query);

        res.status(200).json({
            success: true,
            count: crew.length,
            crew
        });

    } catch (error) {
        console.error('Fetch available crew error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available crew',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/crew/:id
 * @desc    Get single crew member by ID
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
    try {
        const crew = await Crew.findById(req.params.id)
            .populate('assignedFlights', 'flightNumber from to departureTime arrivalTime status aircraft');

        if (!crew) {
            return res.status(404).json({
                success: false,
                message: 'Crew member not found'
            });
        }

        // Crew members can only view their own profile
        if (req.user.role === 'crew' && req.user.crewProfile.toString() !== crew._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.status(200).json({
            success: true,
            crew
        });

    } catch (error) {
        console.error('Fetch crew error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching crew member',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/crew/:id/create-account
 * @desc    Create user account for crew member
 * @access  Private/Admin
 */
router.post('/:id/create-account', protect, authorize('admin'), async (req, res) => {
    try {
        const User = require('../models/User');
        const crew = await Crew.findById(req.params.id);

        if (!crew) {
            return res.status(404).json({
                success: false,
                message: 'Crew member not found'
            });
        }

        // Check if account already exists
        const existingUser = await User.findOne({ email: crew.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User account already exists for this email'
            });
        }

        // Generate temporary password
        const tempPassword = `Crew${Math.floor(100000 + Math.random() * 900000)}!`;

        // Create user account
        const user = await User.create({
            firstName: crew.firstName,
            lastName: crew.lastName,
            email: crew.email,
            phone: crew.phone,
            password: tempPassword,
            role: 'crew',
            crewProfile: crew._id
        });

        res.status(201).json({
            success: true,
            message: 'Crew account created successfully',
            credentials: {
                email: crew.email,
                tempPassword: tempPassword
            },
            user: {
                _id: user._id,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Create crew account error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating crew account',
            error: error.message
        });
    }
});

module.exports = router;
