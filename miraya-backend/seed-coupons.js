import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding default coupons into database...");
  const defaultCoupons = [
    { code: 'MIRAYA10', discount_percent: 10, discount_flat: null, min_order_value: 2000, is_active: true },
    { code: 'LUXURY500', discount_percent: null, discount_flat: 500, min_order_value: 5000, is_active: true },
    { code: 'WELCOME10', discount_percent: 10, discount_flat: null, min_order_value: 1000, is_active: true }
  ];

  for (const cp of defaultCoupons) {
    const res = await prisma.coupon.upsert({
      where: { code: cp.code },
      update: cp,
      create: cp
    });
    console.log(`✅ Coupon ${res.code} ready in DB.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
