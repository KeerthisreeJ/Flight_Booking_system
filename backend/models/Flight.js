const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
    flightNumber: {
        type: String,
        unique: true,
        required: true
    },
    airline: {
        type: String,
        required: true,
        default: 'Air India'
    },
    aircraft: {
        type: String,
        required: true // e.g., "Boeing 737", "Airbus A320"
    },
    from: {
        code: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        }
    },
    to: {
        code: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        }
    },
    departureTime: {
        type: String, // Format: "HH:MM"
        required: true
    },
    arrivalTime: {
        type: String, // Format: "HH:MM"
        required: true
    },
    duration: {
        type: String, // Format: "2h 30m"
        required: true
    },
    frequency: {
        type: [String], // Days of week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        required: true
    },
    price: {
        economy: {
            type: Number,
            required: true
        },
        business: {
            type: Number
        },
        firstClass: {
            type: Number
        }
    },
    capacity: {
        economy: {
            type: Number,
            required: true
        },
        business: {
            type: Number,
            default: 0
        },
        firstClass: {
            type: Number,
            default: 0
        }
    },
    crew: {
        pilot: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Crew'
        },
        coPilot: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Crew'
        },
        cabinCrew: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Crew'
        }]
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'delayed', 'completed'],
        default: 'active'
    },
    amenities: [{
        type: String // e.g., "WiFi", "Meals", "Entertainment"
    }],
    terminal: {
        type: String
    },
    gate: {
        type: String
    }
}, {
    timestamps: true
});

// Index for faster queries
flightSchema.index({ flightNumber: 1 });
flightSchema.index({ 'from.code': 1, 'to.code': 1 });
flightSchema.index({ status: 1 });

// Virtual for total capacity
flightSchema.virtual('totalCapacity').get(function () {
    return (this.capacity.economy || 0) +
        (this.capacity.business || 0) +
        (this.capacity.firstClass || 0);
});

// Ensure virtuals are included in JSON
flightSchema.set('toJSON', { virtuals: true });
flightSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Flight', flightSchema);
