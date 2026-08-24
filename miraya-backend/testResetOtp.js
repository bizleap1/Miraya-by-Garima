import { sendPasswordResetOtpEmail } from './src/utils/email.service.js';

async function test() {
  console.log("Testing Password Reset OTP via Gmail SMTP to mirayaofficial.in@gmail.com ...");
  const res = await sendPasswordResetOtpEmail('mirayaofficial.in@gmail.com', '654321');
  console.log("TEST RESULT:", res ? "PASSWORD RESET OTP SENT SUCCESSFULLY! 🔑" : "FAILED!");
}

test();
