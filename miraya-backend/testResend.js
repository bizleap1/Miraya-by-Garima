import { sendEmail } from './src/utils/email.service.js';
import dotenv from 'dotenv';
dotenv.config();

async function testResend() {
  console.log("=== TESTING RESEND EMAIL CONFIGURATION ===");
  console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "Loaded (Starts with " + process.env.RESEND_API_KEY.substring(0, 7) + "...)" : "NOT SET ❌");
  console.log("EMAIL_FROM:", process.env.EMAIL_FROM || "NOT SET (Defaulting to onboarding@resend.dev) ⚠️");

  const targetEmail = process.argv[2] || process.env.SMTP_EMAIL || 'test@example.com';
  console.log(`Sending test email to: ${targetEmail}...`);

  const result = await sendEmail({
    to: targetEmail,
    subject: "✨ Resend Test Email - Miraya By Garima",
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #c6a46a; border-radius: 10px;">
        <h2 style="color: #5e0a0b;">Domain Verification Test</h2>
        <p>If you received this email, your Resend integration and custom domain are working 100% properly! 🎉</p>
      </div>
    `
  });

  console.log("Result:", result);
}

testResend();
