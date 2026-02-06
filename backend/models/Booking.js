const mongoose = require('mongoose');
const { encryptData, decryptData } = require('../utils/encryption');

const passengerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    ageCategory: {
        type: String,
        enum: ['Child', 'Adult', 'Elder'],
        required: true
    },
    seatNumber: {
        type: String
    }
}, { _id: false }); // Disable _id for subdocuments to ensure signature consistency

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bookingId: {
        type: String,
        unique: true
    },
    flightNumber: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    departureDate: {
        type: Date,
        required: true
    },
    returnDate: {
        type: Date
    },
    tripType: {
        type: String,
        enum: ['oneWay', 'roundWay'],
        default: 'oneWay'
    },
    passengers: [passengerSchema],
    totalPrice: {
        type: Number,
        required: true
    },
    // Encrypted payment information
    encryptedPaymentInfo: {
        type: String,
        select: false // Don't return by default
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    bookingStatus: {
        type: String,
        enum: ['confirmed', 'cancelled', 'completed'],
        default: 'confirmed'
    },
    meals: [{
        item: String,
        quantity: Number,
        price: Number
    }],
    // Digital signature for booking integrity
    digitalSignature: {
        type: String
    },
    // QR code for boarding pass
    qrCode: {
        type: String
    },
    bookingConfirmationSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster queries
bookingSchema.index({ user: 1, bookingId: 1 });
bookingSchema.index({ bookingId: 1 });

// Generate unique booking ID
bookingSchema.pre('save', async function (next) {
    if (!this.bookingId) {
        this.bookingId = 'FB' + Date.now() + Math.floor(Math.random() * 1000);
    }
    next();
});

// Method to encrypt payment information
bookingSchema.methods.setPaymentInfo = function (paymentData) {
    try {
        // Handle if paymentData is already a string
        const dataToEncrypt = typeof paymentData === 'string'
            ? paymentData
            : JSON.stringify(paymentData);
        this.encryptedPaymentInfo = encryptData(dataToEncrypt);
    } catch (error) {
        console.error('Payment encryption error:', error);
        // Don't fail the entire booking if payment encryption fails
        // Just log it and continue without encrypted payment info
        this.encryptedPaymentInfo = null;
    }
};

// Method to decrypt payment information
bookingSchema.methods.getPaymentInfo = function () {
    if (this.encryptedPaymentInfo) {
        const decrypted = decryptData(this.encryptedPaymentInfo);
        return JSON.parse(decrypted);
    }
    return null;
};

// Virtual for total passengers
bookingSchema.virtual('totalPassengers').get(function () {
    return this.passengers.length;
});

// Ensure virtuals are included in JSON
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);
