const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});



// Send Verification Email
exports.sendVerificationEmail = async (email, token) => {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"DiasporaRemit" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Verify Your Email - DiasporaRemit',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Welcome to DiasporaRemit!</h2>
          <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #6366f1; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br/>
            <a href="${verificationUrl}">${verificationUrl}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 24 hours.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (err) {
    console.error('Error sending verification email:', err);
    throw new Error('Failed to send verification email');
  }
};



// Send Password Reset Email
exports.sendPasswordResetEmail = async (email, token) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"DiasporaRemit" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Reset Your Password - DiasporaRemit',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Password Reset Request</h2>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #6366f1; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br/>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (err) {
    console.error('Error sending password reset email:', err);
    throw new Error('Failed to send password reset email');
  }
};