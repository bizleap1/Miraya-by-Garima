import { sendRegisterOtpEmail } from './src/utils/email.service.js';

async function test() {
  console.log("Testing Registration OTP via Gmail SMTP to mirayaofficial.in@gmail.com ...");
  const res = await sendRegisterOtpEmail('mirayaofficial.in@gmail.com', '741258', 'Shreya');
  console.log("TEST RESULT:", res ? "REGISTRATION OTP SENT SUCCESSFULLY! ✨" : "FAILED!");
}

test();
