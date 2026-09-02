import prisma from '../prisma/client.js';

async function main() {
  console.log('Migrating Coupon table schema...');
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP(3);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS usage_limit INTEGER;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "InventoryReservation" ADD COLUMN IF NOT EXISTS coupon_code TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS exchange_enabled BOOLEAN DEFAULT true;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS exchange_window_days INTEGER DEFAULT 7;`);
    console.log('✅ Successfully updated Coupon, InventoryReservation, and StoreSettings table columns!');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
