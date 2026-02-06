// Script to list all users and their roles
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const users = await User.find().select('firstName lastName email role');

        console.log(`Found ${users.length} users:\n`);
        console.log('='.repeat(80));

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log('-'.repeat(80));
        });

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

listUsers();
