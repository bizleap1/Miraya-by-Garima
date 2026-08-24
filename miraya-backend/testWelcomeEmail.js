import { sendWelcomeEmail } from './src/utils/email.service.js';

async function test() {
  console.log("Testing Welcome Email via Gmail SMTP to mirayaofficial.in@gmail.com ...");
  const res = await sendWelcomeEmail('mirayaofficial.in@gmail.com', 'Shreya Meshram');
  console.log("TEST RESULT:", res ? "WELCOME EMAIL SENT SUCCESSFULLY! ✨" : "FAILED!");
}

test();
