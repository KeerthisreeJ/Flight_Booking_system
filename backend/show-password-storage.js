// Script to show how passwords are stored in the database
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function showPasswordStorage() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get one user with password field (normally hidden)
        const user = await User.findOne().select('+password');

        if (user) {
            console.log('📋 User Password Storage Example:\n');
            console.log('='.repeat(80));
            console.log(`User: ${user.firstName} ${user.lastName}`);
            console.log(`Email: ${user.email}`);
            console.log(`\nStored Password Hash (includes salt):`);
            console.log(user.password);
            console.log('='.repeat(80));

            // Explain the format
            console.log('\n📖 Format Breakdown:');
            console.log('$2a$10$...');
            console.log('│  │  │');
            console.log('│  │  └─ Salt (22 chars) + Hash (31 chars)');
            console.log('│  └─ Cost factor (10 rounds)');
            console.log('└─ bcrypt algorithm version');

            console.log('\n✅ The salt is embedded in the hash string!');
            console.log('   No need to store it separately.');
        } else {
            console.log('No users found in database');
        }

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

showPasswordStorage();
