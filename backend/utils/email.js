const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} name - User name
 */
async function sendOTPEmail(email, otp, name) {
    const mailOptions = {
        from: `"Flight Booking System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your OTP for Login - Flight Booking',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Flight Booking System - OTP Verification</h2>
                <p>Hello ${name},</p>
                <p>Your One-Time Password (OTP) for login is:</p>
                <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                    ${otp}
                </div>
                <p><strong>This OTP is valid for 10 minutes.</strong></p>
                <p>If you did not request this OTP, please ignore this email.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
}

/**
 * Send booking confirmation email with QR code
 * @param {string} email - Recipient email
 * @param {Object} bookingDetails - Booking information
 * @param {string} qrCodeDataURL - QR code as data URL
 */
async function sendBookingConfirmation(email, bookingDetails, qrCodeDataURL) {
    const mailOptions = {
        from: `"Flight Booking System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Booking Confirmed - ${bookingDetails.bookingId}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4CAF50;">✈️ Booking Confirmed!</h2>
                <p>Dear ${bookingDetails.userName},</p>
                <p>Your flight booking has been confirmed. Here are your booking details:</p>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Booking Details</h3>
                    <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
                    <p><strong>Flight Number:</strong> ${bookingDetails.flightNumber}</p>
                    <p><strong>From:</strong> ${bookingDetails.from}</p>
                    <p><strong>To:</strong> ${bookingDetails.to}</p>
                    <p><strong>Departure:</strong> ${new Date(bookingDetails.departureDate).toLocaleString()}</p>
                    <p><strong>Passengers:</strong> ${bookingDetails.totalPassengers}</p>
                    <p><strong>Total Amount:</strong> ₹${bookingDetails.totalPrice}</p>
                </div>

                <h3>Boarding Pass QR Code</h3>
                <p>Show this QR code at the airport:</p>
                <div style="text-align: center; margin: 20px 0;">
                    <img src="${qrCodeDataURL}" alt="Boarding Pass QR Code" style="max-width: 200px;" />
                </div>

                <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Important:</strong> Please arrive at the airport at least 2 hours before departure.</p>
                </div>

                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">Thank you for choosing our service!</p>
                <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Booking confirmation sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending booking confirmation:', error);
        throw new Error('Failed to send booking confirmation');
    }
}

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} name - User name
 */
async function sendPasswordResetEmail(email, resetToken, name) {
    const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
        from: `"Flight Booking System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request - Flight Booking',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hello ${name},</p>
                <p>You requested a password reset. Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetURL}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #007bff;">${resetURL}</p>
                <p><strong>This link will expire in 10 minutes.</strong></p>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
}

module.exports = {
    sendOTPEmail,
    sendBookingConfirmation,
    sendPasswordResetEmail
};
