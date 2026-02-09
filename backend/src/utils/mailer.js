const nodemailer = require('nodemailer');

// Create transporter with explicit SMTP settings to avoid IPv6 issues
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Prevent hangs if SMTP is slow/unreachable
  connectionTimeout: 15000, 
  greetingTimeout: 15000,
  socketTimeout: 20000
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body (optional)
 */
const sendEmail = async (to, subject, text, html) => {
  // Fallback for development/missing credentials
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  EMAIL_USER/PASS not set. Logging email to console instead:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    return { success: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"MCD Smart Parking" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text
    });
    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Mailer connection error:', error.message);
  } else {
    console.log('✅ Mailer ready to deliver messages');
  }
});

module.exports = { sendEmail, transporter };
