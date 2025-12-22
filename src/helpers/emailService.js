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
exports.sendVerificationEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Hulex" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Verify Your Email - Hulex',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Welcome to Hulex!</h2>
          <p>Thank you for signing up. Please use the verification code below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1;">
                ${otp}
              </span>
            </div>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">
            Enter this code in the app to verify your email address.
          </p>
          <p style="color: #666; font-size: 14px; text-align: center;">
            This code will expire in 10 minutes.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
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
exports.sendPasswordResetEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Hulex" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Reset Your Password - Hulex',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Password Reset Request</h2>
          <p>We received a request to reset your password. Use the code below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1;">
                ${otp}
              </span>
            </div>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">
            Enter this code in the app to reset your password.
          </p>
          <p style="color: #666; font-size: 14px; text-align: center;">
            This code will expire in 10 minutes.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
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