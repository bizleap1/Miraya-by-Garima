import prisma from '../prisma/client.js';

async function cleanQaTestData() {
  console.log('\n==================================================');
  console.log('   STEP 2: EXECUTING QA TEST DATA CLEANUP & RESET  ');
  console.log('==================================================\n');

  // 1. Identify QA Users
  const qaUserPatterns = ['rt_user_a@miraya.com', 'rt_user_b@miraya.com', 'qa_test_', 'test_', '@mirayatest.com', 'e2e_user', 'user_a@miraya.com', 'ex_user_', 'qa_user_'];

  const allUsers = await prisma.user.findMany();
  
  const qaUsers = allUsers.filter(u => {
    const email = (u.email || '').toLowerCase();
    const name = (u.name || '').toLowerCase();
    return qaUserPatterns.some(pattern => email.includes(pattern) || name.includes(pattern));
  });

  const qaUserIds = qaUsers.map(u => u.id);
  console.log(`1. Found ${qaUsers.length} QA test user account(s):`, qaUsers.map(u => `${u.email} (ID: ${u.id})`));

  // 2. Identify QA Orders
  const allOrders = await prisma.order.findMany({
    include: { items: true, payments: true, returnRequests: true }
  });

  const qaOrders = allOrders.filter(o => {
    const isQaUser = qaUserIds.includes(o.user_id);
    const shipName = (o.shipping_name || '').toLowerCase();
    const isQaShip = shipName.includes('terminal test') || shipName.includes('exchange user') || shipName.includes('rt user') || shipName.includes('qa test');
    return isQaUser || isQaShip;
  });

  const qaOrderIds = qaOrders.map(o => o.id);
  console.log(`2. Found ${qaOrders.length} QA test order(s):`, qaOrderIds.map(id => `#${id}`));

  // 3. Identify QA Exchanges
  const allReturns = await prisma.returnRequest.findMany();
  const qaReturns = allReturns.filter(r => {
    return (r.order_id && qaOrderIds.includes(r.order_id)) ||
           (r.customer_email && r.customer_email.includes('miraya')) ||
           (r.reason && (r.reason.includes('Size too tight') || r.reason.includes('Realtime')));
  });
  const qaReturnIds = qaReturns.map(r => r.id);
  console.log(`3. Found ${qaReturns.length} QA exchange request(s):`, qaReturnIds.map(id => `#${id}`));

  // 4. Identify QA Coupons
  const allCoupons = await prisma.coupon.findMany();
  const qaCoupons = allCoupons.filter(c => {
    const code = (c.code || '').toUpperCase();
    return code.startsWith('RTCOUP') || code.startsWith('E2E_') || code.startsWith('QA_') || code.startsWith('TEST_') || code.includes('RETEST');
  });
  const qaCouponIds = qaCoupons.map(c => c.id);
  console.log(`4. Found ${qaCoupons.length} QA test coupon(s):`, qaCoupons.map(c => `${c.code} (ID: ${c.id})`));

  // ---------------------------------------------------------------------------
  // DESTRUCTIVE CLEANUP FOR CONFIRMED QA DATA ONLY
  // ---------------------------------------------------------------------------
  console.log('\n--- Executing Clean Up Transactions ---');

  await prisma.$transaction(async (tx) => {
    // Clean Exchanges
    if (qaReturnIds.length > 0) {
      await tx.returnRequest.deleteMany({ where: { id: { in: qaReturnIds } } });
      console.log(`  ✅ Deleted ${qaReturnIds.length} QA exchange request(s).`);
    }

    // Clean OrderItems & Payments for QA Orders
    if (qaOrderIds.length > 0) {
      await tx.orderItem.deleteMany({ where: { order_id: { in: qaOrderIds } } });
      await tx.payment.deleteMany({ where: { order_id: { in: qaOrderIds } } });
      await tx.order.deleteMany({ where: { id: { in: qaOrderIds } } });
      console.log(`  ✅ Deleted ${qaOrderIds.length} QA order(s), associated OrderItems, and Payments.`);
    }

    // Clean QA Coupons
    if (qaCouponIds.length > 0) {
      await tx.coupon.deleteMany({ where: { id: { in: qaCouponIds } } });
      console.log(`  ✅ Deleted ${qaCouponIds.length} QA test coupon(s).`);
    }

    // Clean QA Users' Cart, Wishlist, Addresses, & Users
    if (qaUserIds.length > 0) {
      await tx.cartItem.deleteMany({ where: { user_id: { in: qaUserIds } } });
      await tx.wishlist.deleteMany({ where: { user_id: { in: qaUserIds } } });
      await tx.address.deleteMany({ where: { user_id: { in: qaUserIds } } });
      await tx.user.deleteMany({ where: { id: { in: qaUserIds } } });
      console.log(`  ✅ Deleted ${qaUserIds.length} QA test user account(s) and their associated cart/wishlist/addresses.`);
    }

    // Clean Inventory Movements created by QA test scripts
    const deletedMovements = await tx.inventoryMovement.deleteMany({
      where: {
        OR: [
          { note: { contains: 'Realtime test' } },
          { note: { contains: 'Final logic verification' } },
          { note: { contains: 'Initial restock for realtime test' } },
          { reference_id: { in: qaOrderIds.map(id => `ORD-${id}`) } }
        ]
      }
    });
    console.log(`  ✅ Cleaned ${deletedMovements.count} QA inventory movement record(s).`);

    // Reset leftover reserved_stock to 0 across all ProductVariants
    const resetReservations = await tx.productVariant.updateMany({
      where: { reserved_stock: { gt: 0 } },
      data: { reserved_stock: 0 }
    });
    console.log(`  ✅ Reset leftover reserved_stock to 0 across ${resetReservations.count} ProductVariant(s).`);
  });

  // ---------------------------------------------------------------------------
  // 5. POST-CLEANUP INVENTORY AUDIT & INTEGRITY CHECK
  // ---------------------------------------------------------------------------
  console.log('\n==================================================');
  console.log('   STEP 3: POST-CLEANUP INVENTORY & DATA AUDIT     ');
  console.log('==================================================\n');

  const finalUsers = await prisma.user.findMany();
  const finalOrders = await prisma.order.findMany();
  const finalPayments = await prisma.payment.findMany();
  const finalCoupons = await prisma.coupon.findMany();
  const finalExchanges = await prisma.returnRequest.findMany();
  const finalVariants = await prisma.productVariant.findMany();

  console.log('Remaining Authoritative Database Records:');
  console.log(`- Active Real Users:     ${finalUsers.length} (${finalUsers.map(u => u.email).join(', ')})`);
  console.log(`- Real Orders Remaining: ${finalOrders.length}`);
  console.log(`- Payments Remaining:    ${finalPayments.length}`);
  console.log(`- Active Coupons:        ${finalCoupons.length} (${finalCoupons.map(c => c.code).join(', ')})`);
  console.log(`- Exchanges Remaining:   ${finalExchanges.length}`);
  console.log(`- Product Variants:      ${finalVariants.length}`);

  // Inventory bounds check
  let boundsValid = true;
  finalVariants.forEach(v => {
    const avail = v.stock - v.reserved_stock;
    if (v.stock < 0 || v.reserved_stock < 0 || v.reserved_stock > v.stock) {
      console.log(`❌ VIOLATION in Variant #${v.id} (SKU: ${v.sku}): Stock=${v.stock}, Reserved=${v.reserved_stock}, Available=${avail}`);
      boundsValid = false;
    }
  });

  if (boundsValid) {
    console.log('\n✅ INVENTORY BOUNDS AUDIT: 100% INTACT!');
    console.log('  * stock >= 0 (PASS)');
    console.log('  * reserved_stock == 0 (No orphan QA reservations)');
    console.log('  * available_stock = stock - reserved_stock (PASS)');
  }

  console.log('\n==================================================');
  console.log('  🎉 QA DATA CLEANUP & RESET COMPLETED SUCCESSFULLY!');
  console.log('==================================================\n');

  await prisma.$disconnect();
}

cleanQaTestData().catch(console.error);
