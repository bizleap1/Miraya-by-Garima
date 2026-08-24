import bcrypt from 'bcryptjs';
import prisma from './src/prisma/client.js';

async function main() {
  const email = 'admin@mirayaofficial.in';
  const password = 'adminpassword';
  const name = 'Miraya Admin';

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const password_hash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { role: 'admin', password_hash, name },
    });
    console.log(`Updated existing user ${email} to Admin.`);
  } else {
    const password_hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role: 'admin',
      },
    });
    console.log(`Created new Admin user: ${email}`);
  }

  console.log('-----------------------------------');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('-----------------------------------');
}

main()
  .catch((e) => {
    console.error('Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
