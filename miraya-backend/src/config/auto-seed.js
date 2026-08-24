import prisma from '../prisma/client.js';
import bcrypt from 'bcryptjs';
import { migrateProductVariants } from '../scripts/migrateVariants.js';

const catalogProducts = [
  // Indo-Western
  { name: "Pink Blush Lehenga", price: 16191, category: "Indo-Western", sub_category: "Lehenga", stock: 12, size_stock: { S: 3, M: 3, L: 3, XL: 3 }, image_url: "/products/Lehenga-Pink Blush/1.JPG" },
  { name: "Light Purple Lehenga", price: 15831, category: "Indo-Western", sub_category: "Lehenga", stock: 8, size_stock: { S: 2, M: 2, L: 2, XL: 2 }, image_url: "/products/Lehenga-Light Purple/1.JPG" },
  { name: "Golden Lehenga", price: 18891, category: "Indo-Western", sub_category: "Lehenga", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/products/Lehenga-Golden/1.JPG" },
  { name: "Red Indo Western Suit", price: 24831, category: "Indo-Western", sub_category: "Suit", stock: 6, size_stock: { S: 1, M: 2, L: 2, XL: 1 }, image_url: "/products/Indo Western Suit -Red/1.JPG" },
  // Drape Sarees
  { name: "Grey Drape Saree", price: 22681, category: "Drape Sarees", sub_category: "Saree", stock: 15, size_stock: { "Free Size": 15 }, image_url: "/products/Drape Saree-Grey Color/1.JPG" },
  { name: "Pink Blush Drape Saree", price: 17091, category: "Drape Sarees", sub_category: "Saree", stock: 14, size_stock: { "Free Size": 14 }, image_url: "/products/Drape Saree-Pink Blush Color/1.JPG" },
  { name: "Black Drape Saree", price: 11511, category: "Drape Sarees", sub_category: "Saree", stock: 12, size_stock: { "Free Size": 12 }, image_url: "/products/Drape Saree-Black Color/1.JPG" },
  // Designer Suits
  { name: "Red Suit", price: 17731, category: "Designer Suits", sub_category: "Suit", stock: 9, size_stock: { S: 2, M: 3, L: 2, XL: 2 }, image_url: "/products/Suit- Red/1.JPG" },
  { name: "Purple Suit", price: 8991, category: "Designer Suits", sub_category: "Suit", stock: 7, size_stock: { S: 2, M: 2, L: 2, XL: 1 }, image_url: "/products/Suit-Purple/1.JPG" },
  { name: "Mustard Suit", price: 13611, category: "Designer Suits", sub_category: "Suit", stock: 5, size_stock: { S: 1, M: 2, L: 1, XL: 1 }, image_url: "/products/Suit -Mustard/1.JPG" },
  { name: "Mustard Suit 2", price: 15131, category: "Designer Suits", sub_category: "Suit", stock: 4, size_stock: { S: 1, M: 1, L: 1, XL: 1 }, image_url: "/products/Suit-Mustard 2/1.JPG" },
  // Premium Suit Materials
  { name: "Rajastani Pink Material", price: 3951, category: "Premium Suit Materials", sub_category: "Material", stock: 11, size_stock: { "Free Size": 11 }, image_url: "/products/Rajastani-pink/1.JPG" },
  { name: "Rajastani Green Material", price: 6999, category: "Premium Suit Materials", sub_category: "Material", stock: 10, size_stock: { "Free Size": 10 }, image_url: "/products/Rajastani-Green/1.JPG" },
  // Co-ord Sets
  { name: "Grey Co-ord Set", price: 23131, category: "Co-ord Sets", sub_category: "Co-ord", stock: 18, size_stock: { S: 5, M: 5, L: 4, XL: 4 }, image_url: "/products/grey co-order set/1.JPG" },
  { name: "Black Co-ord Set", price: 21591, category: "Co-ord Sets", sub_category: "Co-ord", stock: 16, size_stock: { S: 4, M: 4, L: 4, XL: 4 }, image_url: "/products/Co-order Black/1.JPG" },
  { name: "Golden-Black Co-ord Set", price: 24831, category: "Co-ord Sets", sub_category: "Co-ord", stock: 14, size_stock: { S: 3, M: 4, L: 4, XL: 3 }, image_url: "/products/Co-order Golden-Black/1.JPG" },
  { name: "Dark Green Co-ord Set", price: 21331, category: "Co-ord Sets", sub_category: "Co-ord", stock: 12, size_stock: { S: 3, M: 3, L: 3, XL: 3 }, image_url: "/products/Co-order Dark Green/1.JPG" },
  { name: "White Co-ord Set", price: 23131, category: "Co-ord Sets", sub_category: "Co-ord", stock: 15, size_stock: { S: 4, M: 4, L: 4, XL: 3 }, image_url: "/products/Co-order White/1.JPG" },
  { name: "Red Co-ord Set", price: 4999, category: "Co-ord Sets", sub_category: "Co-ord", stock: 13, size_stock: { S: 3, M: 4, L: 3, XL: 3 }, image_url: "/products/Co-order Red/1.JPG" },
  { name: "Orange Co-ord Set", price: 4999, category: "Co-ord Sets", sub_category: "Co-ord", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/products/Co-order Orange/1.JPG" },
  { name: "Light Green Co-ord Set", price: 4999, category: "Co-ord Sets", sub_category: "Co-ord", stock: 14, size_stock: { S: 4, M: 4, L: 3, XL: 3 }, image_url: "/products/Co-order Light Green/1.JPG" },
  { name: "Mustard Co-ord Set", price: 4999, category: "Co-ord Sets", sub_category: "Co-ord", stock: 11, size_stock: { S: 3, M: 3, L: 3, XL: 2 }, image_url: "/products/Co-order Mustard/1.JPG" }
];

export async function autoSeedIfEmpty() {
  try {
    // 1. Check Product Catalog
    const productCount = await prisma.product.count();
    if (productCount < 5) {
      console.log(`🌱 [AutoSeed] Product count is low (${productCount}). Auto-seeding catalog products...`);
      for (const item of catalogProducts) {
        let cat = await prisma.category.findFirst({ where: { name: item.category } });
        if (!cat) {
          cat = await prisma.category.create({ data: { name: item.category } });
        }

        const existingProduct = await prisma.product.findFirst({ where: { name: item.name } });
        if (!existingProduct) {
          await prisma.product.create({
            data: {
              name: item.name,
              price: item.price,
              stock: item.stock,
              size_stock: item.size_stock,
              image_url: item.image_url,
              images: [item.image_url],
              category_id: cat.id,
              sub_category: item.sub_category,
            },
          });
        } else {
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: { price: item.price }
          });
          await prisma.productVariant.updateMany({
            where: { product_id: existingProduct.id },
            data: { price: item.price }
          });
        }
      }
      console.log('✅ [AutoSeed] Catalog products seeded successfully.');
    }

    // Always audit & ensure product variants exist for all catalog items
    try {
      await migrateProductVariants();
    } catch (_) {}

    // 2. Check Admin Account
    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (!adminUser) {
      console.log('🌱 [AutoSeed] Admin account missing. Creating default admin...');
      const hash = await bcrypt.hash('adminpassword', 10);
      await prisma.user.upsert({
        where: { email: 'admin@miraya.com' },
        update: { password_hash: hash, role: 'admin', name: 'Garima (Admin)' },
        create: {
          name: 'Garima (Admin)',
          email: 'admin@miraya.com',
          password_hash: hash,
          phone: '9999999999',
          role: 'admin',
        },
      });
      console.log('✅ [AutoSeed] Admin user admin@miraya.com ready.');
    }

    // 3. Check Promotional Coupons
    const couponCount = await prisma.coupon.count();
    if (couponCount === 0) {
      console.log('🌱 [AutoSeed] Seeding default promotional coupons...');
      const defaultCoupons = [
        { code: 'MIRAYA10', discount_percent: 10, discount_flat: null, min_order_value: 2000, is_active: true },
        { code: 'LUXURY500', discount_percent: null, discount_flat: 500, min_order_value: 5000, is_active: true },
        { code: 'WELCOME10', discount_percent: 10, discount_flat: null, min_order_value: 1000, is_active: true }
      ];
      for (const cp of defaultCoupons) {
        await prisma.coupon.upsert({
          where: { code: cp.code },
          update: cp,
          create: cp
        });
      }
      console.log('✅ [AutoSeed] Promotional coupons seeded successfully.');
    }

    // 4. Check Customer Accounts
    const customerUserCount = await prisma.user.count({ where: { role: 'customer' } });
    if (customerUserCount < 5) {
      try {
        const { seedVipCustomers } = await import('../../seedCustomers.js');
        await seedVipCustomers();
      } catch (custErr) {
        console.warn('⚠️ [AutoSeed] Customer seeding skipped:', custErr.message);
      }
    }
  } catch (err) {
    console.warn('⚠️ [AutoSeed] Auto-seeding check failed:', err.message);
  }
}
