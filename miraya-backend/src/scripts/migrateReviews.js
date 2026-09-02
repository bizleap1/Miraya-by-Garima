import prisma from '../prisma/client.js';

async function main() {
  console.log('Migrating Review table columns...');
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Review" ALTER COLUMN user_id DROP NOT NULL;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT 'Verified Customer';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS customer_city TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS title TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS occasion TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
    console.log('✅ Successfully updated Review table columns and made user_id optional!');

    // Test inserting sample luxury reviews
    const products = await prisma.product.findMany({ take: 3 });
    if (products.length > 0) {
      const existingReviews = await prisma.review.count();
      if (existingReviews === 0) {
        console.log('Seeding initial luxury verified bride reviews...');
        const sampleReviews = [
          {
            product_id: products[0].id,
            customer_name: 'Dr. Radhika Singhania',
            customer_city: 'Mumbai',
            title: 'Breathtaking Zardozi Embroidery & Fit!',
            rating: 5,
            comment: 'I wore this exquisite outfit for my sister’s sangeet evening and received countless compliments. The fabric quality, lining comfort, and custom drape were impeccable.',
            images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'],
            occasion: 'Sangeet / Mehendi',
            is_verified: true,
            is_approved: true,
            likes_count: 8
          },
          {
            product_id: products[0].id,
            customer_name: 'Ananya Verma',
            customer_city: 'New Delhi',
            title: 'Royal fabric feel and fast delivery',
            rating: 5,
            comment: 'The craftsmanship on the borders is so delicate and regal. Loved the packaging and the personalized touch by the atelier team.',
            images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'],
            occasion: 'Wedding Reception',
            is_verified: true,
            is_approved: true,
            likes_count: 4
          }
        ];

        for (const s of sampleReviews) {
          await prisma.review.create({ data: s });
        }
        console.log('✅ Seeded sample verified customer reviews!');
      }
    }
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
