
const nodemailer = require('nodemailer');

function createTransport() {
  // configure via env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.warn('SMTP not configured. Emails will be skipped. Set SMTP_* env vars.');
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendMail(to, subject, html) {
  const transport = createTransport();
  if (!transport) {
    console.log('Skipping sendMail to', to);
    return;
  }
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
  await transport.sendMail({ from, to, subject, html });
}

module.exports = { sendMail };
