import fs from 'fs';
import path from 'path';
import prisma from '../prisma/client.js';

async function backupDatabase() {
  console.log('\n==================================================');
  console.log('   STEP 1: CREATING FULL PRE-CLEANUP DATABASE BACKUP ');
  console.log('==================================================\n');

  const backupDir = 'C:\\Users\\prave\\.gemini\\antigravity-ide\\brain\\d87297b9-0af7-4bfa-aa39-8a32db903213\\scratch';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `db_backup_${timestamp}.json`);

  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/postgres',
      tables: {
        users: await prisma.user.findMany(),
        products: await prisma.product.findMany(),
        productVariants: await prisma.productVariant.findMany(),
        categories: await prisma.category.findMany(),
        orders: await prisma.order.findMany({ include: { items: true, payments: true } }),
        orderItems: await prisma.orderItem.findMany(),
        payments: await prisma.payment.findMany(),
        coupons: await prisma.coupon.findMany(),
        returnRequests: await prisma.returnRequest.findMany(),
        inventoryMovements: await prisma.inventoryMovement.findMany(),
        cartItems: await prisma.cartItem.findMany(),
        wishlist: await prisma.wishlist.findMany(),
        reviews: await prisma.review.findMany(),
        addresses: await prisma.address.findMany(),


      }
    };

    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');

    console.log('✅ DATABASE BACKUP SUCCESSFUL!');
    console.log(`- Backup Location:  ${backupFilePath}`);
    console.log(`- Timestamp:        ${backupData.timestamp}`);
    console.log('- Record Counts:');
    console.log(`  * Users:          ${backupData.tables.users.length}`);
    console.log(`  * Orders:         ${backupData.tables.orders.length}`);
    console.log(`  * Payments:       ${backupData.tables.payments.length}`);
    console.log(`  * Products:       ${backupData.tables.products.length}`);
    console.log(`  * Variants:       ${backupData.tables.productVariants.length}`);
    console.log(`  * Coupons:        ${backupData.tables.coupons.length}`);
    console.log(`  * Exchanges:      ${backupData.tables.returnRequests.length}\n`);

    return backupFilePath;
  } catch (error) {
    console.error('❌ BACKUP FAILED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase().catch(console.error);
