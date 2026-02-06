// Test all bookings to ensure signatures are valid
const mongoose = require('mongoose');
require('dotenv').config();

const Booking = require('./models/Booking');
const { verifyDigitalSignature } = require('./utils/encryption');
const fs = require('fs');
const path = require('path');

// Load RSA keys
const publicKey = fs.readFileSync(path.join(__dirname, 'keys/public.pem'), 'utf8');

async function testAllBookings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const bookings = await Booking.find({});
        console.log(`Testing ${bookings.length} bookings:\n`);

        let passCount = 0;
        let failCount = 0;

        for (const booking of bookings) {
            // Recreate signature data
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

            const isValid = verifyDigitalSignature(bookingData, booking.digitalSignature, publicKey);

            if (isValid) {
                console.log(`✅ ${booking.bookingId} - VALID`);
                passCount++;
            } else {
                console.log(`❌ ${booking.bookingId} - INVALID`);
                failCount++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`✅ Passed: ${passCount}/${bookings.length}`);
        console.log(`❌ Failed: ${failCount}/${bookings.length}`);
        console.log('='.repeat(50));

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testAllBookings();
