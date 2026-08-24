import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log("Testing Gmail SMTP with credentials:");
console.log("Email:", process.env.SMTP_EMAIL);
console.log("Password set:", !!process.env.SMTP_PASSWORD);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    const info = await transporter.sendMail({
      from: `"Miraya Test" <${process.env.SMTP_EMAIL}>`,
      to: process.env.SMTP_EMAIL,
      subject: "Test Email from Miraya Backend",
      text: "If you get this email, Gmail SMTP is working 100% perfectly!",
    });

    console.log("SUCCESS! Message sent ID:", info.messageId);
  } catch (error) {
    console.error("GMAIL SMTP ERROR:", error);
  }
}

main();
