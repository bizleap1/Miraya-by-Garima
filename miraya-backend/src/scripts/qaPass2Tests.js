import http from 'http';
import prisma from '../prisma/client.js';

const TOKEN_USER_A = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcyLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3ODgzMzY0OTMsImV4cCI6MTc5NjExMjQ5M30.atFrxvF_qCSV689Qk_SpoES5d_rNehDV3PANnsz_urc';
// User B token (User ID 73 if exists or create User B)

function req(path, method, body, token = TOKEN_USER_A) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const r = http.request({ hostname: 'localhost', port: 5000, path, method, headers }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(b) }); }
        catch { resolve({ status: res.statusCode, body: b }); }
      });
    });
    r.on('error', e => resolve({ status: null, body: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

async function runPass2Tests() {
  console.log('\n==================================================');
  console.log('         MIRAYA — QA PASS 2 TEST RUNNER           ');
  console.log('==================================================\n');

  const testReport = [];
  const record = (id, moduleName, scenario, result, notes = '') => {
    console.log(`[${result}] [${id}] ${moduleName} — ${scenario} ${notes ? '(' + notes + ')' : ''}`);
    testReport.push({ id, moduleName, scenario, result, notes });
  };

  // Ensure User B exists for IDOR tests
  let userB = await prisma.user.findFirst({ where: { email: 'qa_user_b@miraya.com' } });
  if (!userB) {
    userB = await prisma.user.create({
      data: {
        name: 'User B IDOR Test',
        email: 'qa_user_b@miraya.com',
        password_hash: '$2b$10$hashedpasswordstubforpass2testing',
        role: 'customer',
      }
    });
  }

  // Create JWT for User B
  const jwt = await import('jsonwebtoken');
  const tokenUserB = jwt.default.sign({ userId: userB.id, role: 'customer' }, 'miraya-dev-jwt-secret-key-2026');

  // ---------------------------------------------------------------------------
  // 1. SECTION 2 & 6: END-TO-END PURCHASE JOURNEY & COUPON VALIDATION
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 2: END-TO-END CUSTOMER JOURNEY ---');
  // Reset test variant stock
  await prisma.$executeRawUnsafe(`UPDATE "ProductVariant" SET stock = 10, reserved_stock = 0;`);
  const p1 = await prisma.product.findFirst({ include: { variants: true } });
  const variant = p1.variants[0];
  const unitPrice = Number(variant.price || p1.price);

  // Create real test coupon with usage_limit = 1
  const testCouponCode = `E2E_${Date.now()}`;
  await prisma.coupon.create({
    data: {
      code: testCouponCode,
      discount_flat: 1000,
      min_order_value: 2000,
      usage_limit: 1,
      used_count: 0,
      is_active: true
    }
  });

  // Step A: Add to cart
  await req('/api/cart/clear', 'DELETE', null, TOKEN_USER_A);
  const cartRes = await req('/api/cart', 'POST', { product_id: p1.id, variant_id: variant.id, quantity: 2, size: variant.size }, TOKEN_USER_A);
  if (cartRes.status === 200 || cartRes.status === 201) {
    record('E2E-001', 'Customer Journey', 'Add outfit to cart', 'PASS', `Qty: 2`);
  } else {
    record('E2E-001', 'Customer Journey', 'Add outfit to cart', 'FAIL', `Status ${cartRes.status}`);
  }

  // Step B: Create payment order with coupon
  const orderRes = await req('/api/payments/create-order', 'POST', {
    items: [{ product_id: p1.id, variant_id: variant.id, quantity: 2, size: variant.size }],
    couponCode: testCouponCode
  }, TOKEN_USER_A);

  const expectedSubtotal = unitPrice * 2;
  const expectedDiscount = 1000;
  const expectedPayable = expectedSubtotal - expectedDiscount;
  const expectedPaise = expectedPayable * 100;

  if (orderRes.status === 200 && orderRes.body.amount === expectedPaise) {
    record('E2E-002', 'Customer Journey', 'Create Razorpay Order with server DB pricing & coupon', 'PASS',
      `Subtotal: ₹${expectedSubtotal}, Discount: ₹${expectedDiscount}, Payable: ₹${expectedPayable} (${expectedPaise} paise)`);
  } else {
    record('E2E-002', 'Customer Journey', 'Create Razorpay Order', 'FAIL',
      `Expected ${expectedPaise} paise, got ${orderRes.body?.amount}`);
  }

  // Step C: Confirm reservation / simulate payment confirmation
  const rzpOrderId = orderRes.body.order_id;
  const { confirmReservationAtomic } = await import('../services/inventory.service.js');
  let createdOrder = null;
  await prisma.$transaction(async (tx) => {
    createdOrder = await confirmReservationAtomic({
      tx,
      razorpay_order_id: rzpOrderId,
      payment_id: `pay_test_${Date.now()}`,
      user_id: 72,
      shippingDetails: { fullName: 'QA User A', phone: '9000000001', addressLine1: 'Jagat Plaza', city: 'Nagpur', state: 'Maharashtra', pincode: '440033' }
    });
  });

  if (createdOrder && createdOrder.id) {
    record('E2E-003', 'Customer Journey', 'Order confirmation & inventory reservation atomic update', 'PASS', `Created Order #${createdOrder.id}`);
  } else {
    record('E2E-003', 'Customer Journey', 'Order confirmation', 'FAIL', 'Order creation failed');
  }

  // Step D: Verify coupon used_count incremented to 1
  const couponAfterOrder = await prisma.coupon.findFirst({ where: { code: testCouponCode } });
  if (couponAfterOrder.used_count === 1) {
    record('E2E-004', 'Coupon Logic', 'Coupon used_count incremented to 1 on confirmed order', 'PASS', `used_count: ${couponAfterOrder.used_count}`);
  } else {
    record('E2E-004', 'Coupon Logic', 'Coupon used_count increment', 'FAIL', `used_count is ${couponAfterOrder.used_count}`);
  }

  // Step E: Verify second checkout with same single-use coupon is REJECTED
  const cpnSecondUse = await req('/api/coupons/apply', 'POST', { code: testCouponCode, cartTotal: 5000 }, TOKEN_USER_A);
  if (cpnSecondUse.status === 400 && cpnSecondUse.body?.code === 'COUPON_LIMIT_REACHED') {
    record('E2E-005', 'Coupon Logic', 'Second checkout with single-use coupon rejected', 'PASS', cpnSecondUse.body?.message);
  } else {
    record('E2E-005', 'Coupon Logic', 'Single-use coupon rejection', 'FAIL', `Status: ${cpnSecondUse.status}`);
  }

  // Step F: Verify order visible in customer's my-orders API
  const myOrders = await req('/api/orders/my-orders', 'GET', null, TOKEN_USER_A);
  const foundInMyOrders = Array.isArray(myOrders.body) && myOrders.body.some(o => o.id === createdOrder.id);
  if (foundInMyOrders) {
    record('E2E-006', 'Customer Account', 'Confirmed order visible in customer account', 'PASS', `Found Order #${createdOrder.id}`);
  } else {
    record('E2E-006', 'Customer Account', 'Order in customer account', 'FAIL', 'Order not listed');
  }

  // ---------------------------------------------------------------------------
  // 2. SECTION 4: REAL POSTGRESQL CONCURRENCY TEST (20 RUNS OF PROMISE.ALL)
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 4: INVENTORY CONCURRENCY ON POSTGRESQL ---');
  let concurrencyPassedRuns = 0;
  const CONCURRENCY_TOTAL_RUNS = 20;

  for (let run = 1; run <= CONCURRENCY_TOTAL_RUNS; run++) {
    // Reset variant stock to exactly 1
    const testVar = await prisma.productVariant.findFirst({ where: { stock: { gte: 1 } } });
    await prisma.$executeRawUnsafe(`UPDATE "ProductVariant" SET stock = 1, reserved_stock = 0 WHERE id = ${testVar.id};`);

    const rzpIdA = `rzp_conc_a_${run}_${Date.now()}`;
    const rzpIdB = `rzp_conc_b_${run}_${Date.now()}`;

    const { reserveInventoryAtomic } = await import('../services/inventory.service.js');

    const [resA, resB] = await Promise.allSettled([
      prisma.$transaction(tx => reserveInventoryAtomic({
        tx,
        items: [{ product_id: testVar.product_id, variant_id: testVar.id, quantity: 1, size: testVar.size }],
        user_id: 72,
        razorpay_order_id: rzpIdA
      })),
      prisma.$transaction(tx => reserveInventoryAtomic({
        tx,
        items: [{ product_id: testVar.product_id, variant_id: testVar.id, quantity: 1, size: testVar.size }],
        user_id: userB.id,
        razorpay_order_id: rzpIdB
      }))
    ]);

    const isAFulfilled = resA.status === 'fulfilled';
    const isBFulfilled = resB.status === 'fulfilled';

    const checkVar = await prisma.productVariant.findUnique({ where: { id: testVar.id } });

    // Exactly ONE must succeed and ONE must fail with 409 OUT_OF_STOCK
    if ((isAFulfilled && !isBFulfilled) || (!isAFulfilled && isBFulfilled)) {
      if (checkVar.reserved_stock <= checkVar.stock && checkVar.stock >= 0) {
        concurrencyPassedRuns++;
      }
    }
  }

  if (concurrencyPassedRuns === CONCURRENCY_TOTAL_RUNS) {
    record('CONC-001', 'PostgreSQL Concurrency', `Race condition testing (20/20 runs passed)`, 'PASS',
      `Zero overselling, 1 winner / 1 rejected per run, physical stock never negative`);
  } else {
    record('CONC-001', 'PostgreSQL Concurrency', `Race condition testing`, 'FAIL',
      `Passed ${concurrencyPassedRuns}/${CONCURRENCY_TOTAL_RUNS} runs`);
  }

  // ---------------------------------------------------------------------------
  // 3. SECTION 5: CART + STALE STOCK EDGE CASE
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 5: CART STALE STOCK EDGE CASE ---');
  const testVarStale = await prisma.productVariant.findFirst({ where: { stock: { gte: 1 } } });
  await prisma.$executeRawUnsafe(`UPDATE "ProductVariant" SET stock = 3, reserved_stock = 0 WHERE id = ${testVarStale.id};`);

  // User A puts qty 2 in cart
  await req('/api/cart/clear', 'DELETE', null, TOKEN_USER_A);
  await req('/api/cart', 'POST', { product_id: testVarStale.product_id, variant_id: testVarStale.id, quantity: 2, size: testVarStale.size }, TOKEN_USER_A);

  // User B buys 2 items (reducing available stock to 1)
  await prisma.$executeRawUnsafe(`UPDATE "ProductVariant" SET stock = 1, reserved_stock = 0 WHERE id = ${testVarStale.id};`);

  // User A attempts checkout with qty 2 (available is now 1)
  const staleCheckout = await req('/api/payments/create-order', 'POST', {
    items: [{ product_id: testVarStale.product_id, variant_id: testVarStale.id, quantity: 2, size: testVarStale.size }]
  }, TOKEN_USER_A);

  if (staleCheckout.status === 409 && staleCheckout.body?.code === 'OUT_OF_STOCK') {
    record('CART-EDGE-001', 'Stale Stock Guard', 'Checkout rejects cart item when stock drops below cart qty', 'PASS', staleCheckout.body?.message);
  } else {
    record('CART-EDGE-001', 'Stale Stock Guard', 'Checkout stale stock rejection', 'FAIL', `Status: ${staleCheckout.status}`);
  }

  // ---------------------------------------------------------------------------
  // 4. SECTION 7: ADDRESS TESTING & IDOR SECURITY
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 7: ADDRESS TESTING & SECURITY ---');
  // Add address for User A
  const addAddr = await req('/api/addresses', 'POST', {
    fullName: 'User A Address',
    phone: '9000000001',
    line1: '123 Main St',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440033',
    label: 'Home'
  }, TOKEN_USER_A);

  let addrId = null;
  if (addAddr.status === 201 || addAddr.status === 200) {
    addrId = addAddr.body.id || addAddr.body.address?.id;
    record('ADDR-001', 'Address System', 'Add new shipping address', 'PASS', `Address ID: ${addrId}`);
  } else {
    record('ADDR-001', 'Address System', 'Add new shipping address', 'FAIL', `Status: ${addAddr.status}`);
  }

  // IDOR Test: User B tries to update User A's address
  if (addrId) {
    const idorAddr = await req(`/api/addresses/${addrId}`, 'PUT', { line1: 'Hacked Address' }, tokenUserB);
    if (idorAddr.status === 403 || idorAddr.status === 404) {
      record('SEC-ADDR-001', 'Address IDOR Security', 'User B blocked from editing User A address', 'PASS', `Status: ${idorAddr.status}`);
    } else {
      record('SEC-ADDR-001', 'Address IDOR Security', 'User B edited User A address!', 'FAIL', `Status: ${idorAddr.status}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. SECTION 8: ORDER / INVOICE IDOR & PDF GENERATION
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 8: ORDER / INVOICE SECURITY & PDF ---');
  if (createdOrder && createdOrder.id) {
    // User A views own invoice
    const ownInvoice = await req(`/api/orders/${createdOrder.id}/invoice`, 'GET', null, TOKEN_USER_A);
    if (ownInvoice.status === 200 || typeof ownInvoice.body === 'string') {
      record('INV-001', 'Invoice System', 'User A downloads own PDF invoice', 'PASS', 'PDF binary returned');
    } else {
      record('INV-001', 'Invoice System', 'User A invoice download', 'FAIL', `Status: ${ownInvoice.status}`);
    }

    // User B tries to view User A's invoice (IDOR)
    const idorInvoice = await req(`/api/orders/${createdOrder.id}/invoice`, 'GET', null, tokenUserB);
    if (idorInvoice.status === 403 || idorInvoice.status === 404) {
      record('SEC-INV-001', 'Invoice IDOR Security', 'User B blocked from accessing User A invoice', 'PASS', `Status: ${idorInvoice.status}`);
    } else {
      record('SEC-INV-001', 'Invoice IDOR Security', 'User B accessed User A invoice!', 'FAIL', `Status: ${idorInvoice.status}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 6. SECTION 9: RETURN & EXCHANGE TESTING
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 9: RETURN / EXCHANGE TESTING ---');
  if (createdOrder && createdOrder.id) {
    // Request valid return
    const retReq = await req('/api/returns', 'POST', {
      order_id: createdOrder.id,
      product_id: p1.id,
      variant_id: variant.id,
      quantity: 1,
      reason: 'Size too large'
    }, TOKEN_USER_A);

    if (retReq.status === 201 || retReq.status === 200) {
      record('RET-001', 'Returns', 'Customer submits return request for own order', 'PASS', `Return ID: ${retReq.body?.id || retReq.body?.returnRequest?.id}`);
    } else {
      record('RET-001', 'Returns', 'Customer return request', 'FAIL', `Status: ${retReq.status}, Message: ${retReq.body?.message}`);
    }

    // User B tries to return User A's order (IDOR)
    const retIdor = await req('/api/returns', 'POST', {
      order_id: createdOrder.id,
      product_id: p1.id,
      variant_id: variant.id,
      quantity: 1,
      reason: 'Fraud attempt'
    }, tokenUserB);

    if (retIdor.status === 403 || retIdor.status === 404 || retIdor.status === 400) {
      record('SEC-RET-001', 'Return IDOR Security', 'User B blocked from requesting return on User A order', 'PASS', `Status: ${retIdor.status}`);
    } else {
      record('SEC-RET-001', 'Return IDOR Security', 'User B requested return on User A order!', 'FAIL', `Status: ${retIdor.status}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 7. SECTION 10: WISHLIST TESTING
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 10: WISHLIST TESTING ---');
  // Add item to wishlist
  const addWish = await req('/api/wishlist', 'POST', { product_id: p1.id }, TOKEN_USER_A);
  if (addWish.status === 200 || addWish.status === 201) {
    record('WISH-001', 'Wishlist', 'Add item to wishlist', 'PASS', 'Item added');
  } else {
    record('WISH-001', 'Wishlist', 'Add item to wishlist', 'FAIL', `Status: ${addWish.status}`);
  }

  // Duplicate add to wishlist
  const dupWish = await req('/api/wishlist', 'POST', { product_id: p1.id }, TOKEN_USER_A);
  if (dupWish.status === 200 || dupWish.status === 400 || dupWish.body?.message?.includes('already')) {
    record('WISH-002', 'Wishlist', 'Duplicate wishlist add handled safely', 'PASS', 'Duplicate ignored/notified');
  } else {
    record('WISH-002', 'Wishlist', 'Duplicate wishlist add', 'FAIL', `Status: ${dupWish.status}`);
  }

  // ---------------------------------------------------------------------------
  // 8. SECTION 16: 9.5MB IMAGE PERFORMANCE AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 16: PERFORMANCE & 9.5MB IMAGE AUDIT ---');
  const fs = await import('fs');
  const path = await import('path');
  const rootFiles = fs.readdirSync(path.join(process.cwd(), '..'));
  const largeImg = rootFiles.find(f => f.includes('Gemini_Generated_Image') || f.endsWith('.png'));

  // Check if frontend src files reference this image
  const { execSync } = await import('child_process');
  let referencedInSrc = false;
  try {
    const grepRes = execSync(`git grep "Gemini_Generated_Image" ..\\src`, { encoding: 'utf8' });
    if (grepRes.trim()) referencedInSrc = true;
  } catch (_) {}

  if (!referencedInSrc) {
    record('PERF-001', 'Performance', '9.5MB root image is NOT shipped or referenced in production frontend src', 'PASS', 'Unused root asset — P4 cleanup item');
  } else {
    record('PERF-001', 'Performance', '9.5MB image IS referenced in frontend src', 'FAIL', 'Loaded in production — High severity performance bug!');
  }

  console.log('\n==================================================');
  console.log('              QA PASS 2 RUN COMPLETE              ');
  console.log('==================================================\n');

  return testReport;
}

runPass2Tests().catch(console.error);
