// Test script to verify digital signature functionality
const mongoose = require('mongoose');
require('dotenv').config();

const Booking = require('./models/Booking');
const { createDigitalSignature, verifyDigitalSignature } = require('./utils/encryption');
const fs = require('fs');
const path = require('path');

// Load RSA keys
const privateKey = fs.readFileSync(path.join(__dirname, 'keys/private.pem'), 'utf8');
const publicKey = fs.readFileSync(path.join(__dirname, 'keys/public.pem'), 'utf8');

async function testSignatureVerification() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find a booking to test
        const booking = await Booking.findOne().sort({ createdAt: -1 });

        if (!booking) {
            console.log('❌ No bookings found in database');
            console.log('Please create a booking first to test verification');
            process.exit(0);
        }

        console.log('\n📋 Testing booking:', booking.bookingId);
        console.log('Flight:', booking.flightNumber);
        console.log('Route:', booking.from, '→', booking.to);
        console.log('Passengers:', booking.passengers.length);

        // Check if passengers have _id
        console.log('\n🔍 Checking passenger structure:');
        booking.passengers.forEach((p, i) => {
            console.log(`Passenger ${i + 1}:`, {
                name: p.name,
                ageCategory: p.ageCategory,
                has_id: !!p._id
            });
        });

        // Recreate the signature data (same as in booking.js)
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

        console.log('\n🔐 Signature data:');
        console.log('Data length:', bookingData.length, 'bytes');
        console.log('First 100 chars:', bookingData.substring(0, 100));

        console.log('\n📝 Stored signature:');
        console.log(booking.digitalSignature.substring(0, 80) + '...');

        // Verify the signature
        const isValid = verifyDigitalSignature(bookingData, booking.digitalSignature, publicKey);

        console.log('\n' + '='.repeat(50));
        if (isValid) {
            console.log('✅ VERIFICATION SUCCESSFUL!');
            console.log('The digital signature is valid.');
        } else {
            console.log('❌ VERIFICATION FAILED!');
            console.log('The digital signature is invalid.');

            // Try to create a new signature with current data
            console.log('\n🔧 Creating new signature with current data...');
            const newSignature = createDigitalSignature(bookingData, privateKey);
            console.log('New signature:', newSignature.substring(0, 80) + '...');

            // Verify the new signature
            const newIsValid = verifyDigitalSignature(bookingData, newSignature, publicKey);
            console.log('New signature valid:', newIsValid);

            console.log('\n💡 Signatures match:', booking.digitalSignature === newSignature);
        }
        console.log('='.repeat(50));

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testSignatureVerification();
