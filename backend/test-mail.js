require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: 'Test Email',
    text: 'If you receive this, email is working!'
}, (error, info) => {
    if (error) {
        console.log('❌ Email failed:', error);
    } else {
        console.log('✅ Email sent successfully!');
    }
});