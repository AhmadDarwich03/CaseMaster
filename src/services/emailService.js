// src/services/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();
// Set up the email transporter

console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Pass:', process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
    service: 'Gmail', // You can change this to your preferred email service (e.g., SendGrid, etc.)
    auth: {
        user: process.env.EMAIL_USER, // Store email credentials in environment variables
        pass: process.env.EMAIL_PASS,
    },
});

// Function to send ticket update email
async function sendTicketUpdateEmail(userEmail, ticketId, updateMessage) {
    try {
        const mailOptions = {
            from: '"Support Team" <support@yourdomain.com>', // Sender's email address
            to: userEmail, // Receiver's email address
            subject: `Ticket Update: Ticket #${ticketId}`, // Email subject
            html: `
                <p>Dear user,</p>
                <p>Your ticket with ID <strong>${ticketId}</strong> has been updated.</p>
                <p>${updateMessage}</p>
                <p>Best regards,<br>Support Team</p>
            `,
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log('Ticket update email sent successfully.');
    } catch (error) {
        console.error('Error sending ticket update email:', error);
    }
}

module.exports = {
    sendTicketUpdateEmail,
};
