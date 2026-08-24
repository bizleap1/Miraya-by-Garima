import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = 'admin@miraya.com';
  const password = 'adminpassword';
  const hash = await bcrypt.hash(password, 10);

  // Upsert: create if not exists, update password if exists
  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password_hash: hash,
      role: 'admin',
      name: 'Garima (Admin)',
    },
    create: {
      name: 'Garima (Admin)',
      email,
      password_hash: hash,
      phone: '9999999999',
      role: 'admin',
    },
  });

  console.log(`\n✅ Admin user ready:`);
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role:     ${admin.role}`);
  console.log(`   ID:       ${admin.id}\n`);

  await prisma.$disconnect();
}

seedAdmin().catch((e) => {
  console.error('❌ Failed to seed admin:', e.message);
  process.exit(1);
});
