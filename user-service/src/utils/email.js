const { config } = require('../config');
const sgMail = require('@sendgrid/mail');

require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const minutes = (config.OTP_TTL || 300) / 60;

async function sendOtpEmail(email, otp) {
    const msg = {
        to: email,
        from: config.MAIL_SEND,
        subject: 'Your IRCTC verification code',
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 420px;
                margin: auto;
                padding: 20px;
                border: 1px solid #e5e5e5;
                border-radius: 10px;
                background: #ffffff;
                box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            ">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">IRCTC Account Verification</h2>
                    <p>Use the OTP below to verify your email.</p>
                </div>

                <div style="
                    text-align: center;
                    font-size: 30px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    margin: 25px 0;
                ">
                    ${otp}
                </div>

                <p>
                    This OTP is valid for ${minutes} minutes.
                </p>

                <p style="font-size: 13px; color: #666;">
                    If you did not request this code, you can safely ignore this email.
                </p>
            </div>
        `,
    };

    await sgMail.send(msg);
}

module.exports = {
    sendOtpEmail,
};