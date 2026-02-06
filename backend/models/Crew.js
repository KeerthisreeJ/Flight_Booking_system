const mongoose = require('mongoose');

const crewSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['pilot', 'co-pilot', 'cabin-crew', 'senior-cabin-crew'],
        required: true
    },
    licenseNumber: {
        type: String,
        required: function () {
            return this.role === 'pilot' || this.role === 'co-pilot';
        }
    },
    experience: {
        type: Number, // years of experience
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'on-leave', 'inactive'],
        default: 'active'
    },
    assignedFlights: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flight'
    }],
    certifications: [{
        name: String,
        issueDate: Date,
        expiryDate: Date
    }],
    nationality: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    joinDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Generate unique employee ID
crewSchema.pre('save', async function (next) {
    if (!this.employeeId) {
        const rolePrefix = {
            'pilot': 'PLT',
            'co-pilot': 'CPL',
            'cabin-crew': 'CC',
            'senior-cabin-crew': 'SCC'
        };
        this.employeeId = rolePrefix[this.role] + Date.now() + Math.floor(Math.random() * 100);
    }
    next();
});

// Index for faster queries
crewSchema.index({ role: 1, status: 1 });
crewSchema.index({ employeeId: 1 });

module.exports = mongoose.model('Crew', crewSchema);
