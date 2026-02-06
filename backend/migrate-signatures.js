// Migration script to regenerate digital signatures for existing bookings
const mongoose = require('mongoose');
require('dotenv').config();

const Booking = require('./models/Booking');
const { createDigitalSignature } = require('./utils/encryption');
const fs = require('fs');
const path = require('path');

// Load RSA keys
const privateKey = fs.readFileSync(path.join(__dirname, 'keys/private.pem'), 'utf8');

async function regenerateSignatures() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all bookings
        const bookings = await Booking.find({});
        console.log(`\n📋 Found ${bookings.length} bookings to process\n`);

        let successCount = 0;
        let errorCount = 0;

        for (const booking of bookings) {
            try {
                console.log(`Processing booking: ${booking.bookingId}`);

                // Recreate booking data for signature (same as in booking.js)
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

                // Create new signature
                const newSignature = createDigitalSignature(bookingData, privateKey);

                // Update booking with new signature
                booking.digitalSignature = newSignature;
                await booking.save();

                console.log(`  ✅ Signature regenerated successfully`);
                successCount++;

            } catch (error) {
                console.error(`  ❌ Error processing booking ${booking.bookingId}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`✅ Successfully processed: ${successCount} bookings`);
        if (errorCount > 0) {
            console.log(`❌ Failed to process: ${errorCount} bookings`);
        }
        console.log('='.repeat(50));

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

regenerateSignatures();
