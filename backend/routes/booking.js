const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const { protect, authorize, checkOwnership } = require('../middleware/auth');
const { createDigitalSignature, hashData } = require('../utils/encryption');
const { sendBookingConfirmation } = require('../utils/email');
const fs = require('fs');
const path = require('path');

// Load or generate RSA keys for digital signatures
let privateKey, publicKey;
try {
    const keysPath = path.join(__dirname, '../keys');
    if (!fs.existsSync(keysPath)) {
        fs.mkdirSync(keysPath, { recursive: true });
    }

    const privateKeyPath = path.join(keysPath, 'private.pem');
    const publicKeyPath = path.join(keysPath, 'public.pem');

    if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
        privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        publicKey = fs.readFileSync(publicKeyPath, 'utf8');
        console.log('✅ RSA keys loaded from files');
        console.log('🔑 Public key fingerprint:', publicKey.substring(27, 77) + '...');
    } else {
        const { generateRSAKeyPair } = require('../utils/encryption');
        const keys = generateRSAKeyPair();
        privateKey = keys.privateKey;
        publicKey = keys.publicKey;
        fs.writeFileSync(privateKeyPath, privateKey);
        fs.writeFileSync(publicKeyPath, publicKey);
        console.log('✅ RSA keys generated and saved');
        console.log('🔑 Public key fingerprint:', publicKey.substring(27, 77) + '...');
    }
} catch (error) {
    console.error('❌ Error loading RSA keys:', error);
}

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking with encryption and digital signature
 * @access  Private
 */
router.post('/', protect, [
    body('flightNumber').notEmpty().withMessage('Flight number is required'),
    body('from').notEmpty().withMessage('Departure location is required'),
    body('to').notEmpty().withMessage('Destination is required'),
    body('departureDate').isISO8601().withMessage('Valid departure date is required'),
    body('passengers').isArray({ min: 1 }).withMessage('At least one passenger is required'),
    body('totalPrice').isNumeric().withMessage('Valid price is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const {
            flightNumber,
            from,
            to,
            departureDate,
            returnDate,
            tripType,
            passengers,
            totalPrice,
            paymentInfo,
            meals
        } = req.body;

        // Create booking object
        const booking = new Booking({
            user: req.user._id,
            flightNumber,
            from,
            to,
            departureDate,
            returnDate,
            tripType: tripType || 'oneWay',
            passengers,
            totalPrice,
            meals: meals || [],
            paymentStatus: 'completed'
        });

        // Encrypt payment information (credit card, etc.)
        if (paymentInfo) {
            booking.setPaymentInfo(paymentInfo);
        }

        // Generate booking data for signature
        // Strip _id from passengers to ensure consistency
        const passengersForSignature = booking.passengers.map(p => ({
            name: p.name,
            ageCategory: p.ageCategory
        }));

        const bookingData = JSON.stringify({
            bookingId: booking.bookingId,
            user: booking.user.toString(),
            flightNumber: booking.flightNumber,
            from: booking.from,
            to: booking.to,
            departureDate: booking.departureDate.toISOString(),
            totalPrice: booking.totalPrice,
            passengers: passengersForSignature
        });

        console.log('🔐 Creating signature for:', bookingData);
        console.log('📏 Data length:', bookingData.length, 'bytes');

        // Create digital signature
        booking.digitalSignature = createDigitalSignature(bookingData, privateKey);
        console.log('✅ Signature created:', booking.digitalSignature.substring(0, 50) + '...');

        // Generate QR code for boarding pass
        const qrData = JSON.stringify({
            bookingId: booking.bookingId,
            passengerName: passengers[0].name,
            flightNumber: booking.flightNumber,
            from: booking.from,
            to: booking.to,
            departureDate: booking.departureDate,
            signature: booking.digitalSignature.substring(0, 50) // Truncated for QR
        });

        // Generate QR code as data URL
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.95,
            margin: 1,
            width: 300
        });

        booking.qrCode = qrCodeDataURL;

        // Save booking
        await booking.save();

        // Send confirmation email with QR code
        try {
            await sendBookingConfirmation(
                req.user.email,
                {
                    bookingId: booking.bookingId,
                    userName: `${req.user.firstName} ${req.user.lastName}`,
                    flightNumber: booking.flightNumber,
                    from: booking.from,
                    to: booking.to,
                    departureDate: booking.departureDate,
                    totalPassengers: passengers.length,
                    totalPrice: booking.totalPrice
                },
                qrCodeDataURL
            );
            booking.bookingConfirmationSent = true;
            await booking.save();
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail the booking if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            booking: {
                bookingId: booking.bookingId,
                flightNumber: booking.flightNumber,
                from: booking.from,
                to: booking.to,
                departureDate: booking.departureDate,
                returnDate: booking.returnDate,
                passengers: booking.passengers,
                totalPrice: booking.totalPrice,
                qrCode: booking.qrCode,
                digitalSignature: booking.digitalSignature
            }
        });

    } catch (error) {
        console.error('Booking creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating booking',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings for logged in user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .select('-encryptedPaymentInfo'); // Don't send encrypted payment info

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });

    } catch (error) {
        console.error('Fetch bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/bookings/:bookingId
 * @desc    Get single booking by ID
 * @access  Private
 */
router.get('/:bookingId', protect, async (req, res) => {
    try {
        const booking = await Booking.findOne({ bookingId: req.params.bookingId })
            .populate('user', 'firstName lastName email');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check ownership (users can only see their own bookings, admin can see all)
        if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this booking'
            });
        }

        res.status(200).json({
            success: true,
            booking
        });

    } catch (error) {
        console.error('Fetch booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/bookings/:bookingId/cancel
 * @desc    Cancel a booking
 * @access  Private
 */
router.put('/:bookingId/cancel', protect, async (req, res) => {
    try {
        const booking = await Booking.findOne({ bookingId: req.params.bookingId });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check ownership
        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this booking'
            });
        }

        // Check if booking can be cancelled
        if (booking.bookingStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        if (booking.bookingStatus === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel completed booking'
            });
        }

        // Cancel booking
        booking.bookingStatus = 'cancelled';
        booking.paymentStatus = 'refunded';
        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            booking
        });

    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling booking',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/bookings/:bookingId/verify
 * @desc    Verify booking digital signature
 * @access  Public (for airport staff)
 */
router.get('/:bookingId/verify', async (req, res) => {
    try {
        const booking = await Booking.findOne({ bookingId: req.params.bookingId });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Recreate booking data
        // Strip _id from passengers to ensure consistency
        const passengersForSignature = booking.passengers.map(p => ({
            name: p.name,
            ageCategory: p.ageCategory
        }));

        const bookingData = JSON.stringify({
            bookingId: booking.bookingId,
            user: booking.user.toString(),
            flightNumber: booking.flightNumber,
            from: booking.from,
            to: booking.to,
            departureDate: booking.departureDate.toISOString(),
            totalPrice: booking.totalPrice,
            passengers: passengersForSignature
        });

        console.log('🔍 Verifying signature for:', bookingData);
        console.log('📝 Stored signature:', booking.digitalSignature.substring(0, 50) + '...');
        console.log('📏 Data length:', bookingData.length, 'bytes');

        // Verify signature
        const { verifyDigitalSignature } = require('../utils/encryption');
        const isValid = verifyDigitalSignature(bookingData, booking.digitalSignature, publicKey);

        console.log('✅ Verification result:', isValid);

        if (!isValid) {
            console.log('❌ VERIFICATION FAILED');
        }

        res.status(200).json({
            success: true,
            verified: isValid,
            message: isValid ? 'Booking is authentic' : 'Booking verification failed',
            bookingDetails: {
                bookingId: booking.bookingId,
                flightNumber: booking.flightNumber,
                from: booking.from,
                to: booking.to,
                status: booking.bookingStatus
            }
        });

    } catch (error) {
        console.error('Verify booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying booking',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/bookings/:bookingId/qrcode
 * @desc    Get QR code for boarding pass
 * @access  Private
 */
router.get('/:bookingId/qrcode', protect, async (req, res) => {
    try {
        const booking = await Booking.findOne({ bookingId: req.params.bookingId });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check ownership
        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this booking'
            });
        }

        res.status(200).json({
            success: true,
            qrCode: booking.qrCode
        });

    } catch (error) {
        console.error('QR code fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching QR code',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/booking/:id
 * @desc    Update booking details (Admin only)
 * @access  Private/Admin
 */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const {
            flightNumber,
            from,
            to,
            departureDate,
            returnDate,
            totalPrice,
            bookingStatus,
            paymentStatus
        } = req.body;

        // Update fields
        if (flightNumber) booking.flightNumber = flightNumber;
        if (from) booking.from = from;
        if (to) booking.to = to;
        if (departureDate) booking.departureDate = departureDate;
        if (returnDate !== undefined) booking.returnDate = returnDate;
        if (totalPrice) booking.totalPrice = totalPrice;
        if (bookingStatus) booking.bookingStatus = bookingStatus;
        if (paymentStatus) booking.paymentStatus = paymentStatus;

        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Booking updated successfully',
            booking
        });

    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating booking',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/booking/:id
 * @desc    Delete booking (Admin only)
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Booking deleted successfully'
        });

    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting booking',
            error: error.message
        });
    }
});

module.exports = router;
