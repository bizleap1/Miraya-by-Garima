import { sendLoginOtpEmail } from './src/utils/email.service.js';

async function test() {
  console.log("Testing Login OTP via Gmail SMTP to mirayaofficial.in@gmail.com ...");
  const res = await sendLoginOtpEmail('mirayaofficial.in@gmail.com', '984512');
  console.log("TEST RESULT:", res ? "OTP EMAIL SENT SUCCESSFULLY! 🔑" : "FAILED!");
}

test();
