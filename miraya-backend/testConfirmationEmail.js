import { sendOrderConfirmationEmail } from './src/utils/email.service.js';

async function test() {
  const dummyOrder = {
    id: 1088,
    total: 12999,
    status: 'PAID'
  };

  console.log("Sending order confirmation email to mirayaofficial.in@gmail.com ...");
  const result = await sendOrderConfirmationEmail('mirayaofficial.in@gmail.com', dummyOrder);
  console.log("RESULT:", result ? "SUCCESS SENT!" : "FAILED!");
}

test();
