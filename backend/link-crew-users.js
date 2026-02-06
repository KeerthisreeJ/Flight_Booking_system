// Script to link existing crew members with user accounts
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Crew = require('./models/Crew');

async function linkCrewToUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all crew members
        const allCrew = await Crew.find({});
        console.log(`📋 Found ${allCrew.length} crew members\n`);

        let linked = 0;
        let created = 0;
        let skipped = 0;

        for (const crew of allCrew) {
            console.log(`Processing: ${crew.firstName} ${crew.lastName} (${crew.email})`);

            // Check if user already exists with this email
            let user = await User.findOne({ email: crew.email });

            if (user) {
                // User exists, check if already linked
                if (user.crewProfile && user.crewProfile.toString() === crew._id.toString()) {
                    console.log(`  ✓ Already linked`);
                    skipped++;
                } else {
                    // Link the crew profile
                    user.crewProfile = crew._id;
                    user.role = 'crew';
                    await user.save();
                    console.log(`  ✅ Linked existing user account`);
                    linked++;
                }
            } else {
                // Create new user account
                const tempPassword = `Crew${Math.floor(100000 + Math.random() * 900000)}!`;

                user = await User.create({
                    firstName: crew.firstName,
                    lastName: crew.lastName,
                    email: crew.email,
                    phone: crew.phone,
                    password: tempPassword,
                    role: 'crew',
                    crewProfile: crew._id
                });

                console.log(`  ✅ Created new user account`);
                console.log(`     Email: ${crew.email}`);
                console.log(`     Temp Password: ${tempPassword}`);
                created++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✅ Linked: ${linked} crew members`);
        console.log(`✅ Created: ${created} new user accounts`);
        console.log(`⏭️  Skipped: ${skipped} (already linked)`);
        console.log('='.repeat(60));

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

linkCrewToUsers();
