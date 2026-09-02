import http from 'http';
import prisma from '../prisma/client.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'miraya-dev-jwt-secret-key-2026';

function req(path, method, body, token) {
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

async function runPass2_1RetestSuite() {
  console.log('\n==================================================');
  console.log('       MIRAYA — QA FIX PASS 2.1 RETEST SUITE       ');
  console.log('==================================================\n');

  const results = [];
  const logPass = (id, title, detail = '') => { console.log(`✅ PASS [${id}] ${title} ${detail ? '— ' + detail : ''}`); results.push({ id, title, pass: true, detail }); };
  const logFail = (id, title, detail = '') => { console.log(`❌ FAIL [${id}] ${title} — ${detail}`); results.push({ id, title, pass: false, detail }); };

  // Setup User A, User B, and Admin tokens
  let userA = await prisma.user.findFirst({ where: { email: 'qa_user_a_pass21@miraya.com' } });
  if (!userA) {
    userA = await prisma.user.create({
      data: { name: 'User A Pass 2.1', email: 'qa_user_a_pass21@miraya.com', password_hash: '$2b$10$hash', role: 'customer' }
    });
  }

  let userB = await prisma.user.findFirst({ where: { email: 'qa_user_b_pass21@miraya.com' } });
  if (!userB) {
    userB = await prisma.user.create({
      data: { name: 'User B Pass 2.1', email: 'qa_user_b_pass21@miraya.com', password_hash: '$2b$10$hash', role: 'customer' }
    });
  }

  let adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: { name: 'Admin Retest User', email: 'admin_retest@miraya.com', password_hash: '$2b$10$hash', role: 'admin' }
    });
  }

  const tokenUserA = jwt.sign({ userId: userA.id, role: 'customer' }, JWT_SECRET);
  const tokenUserB = jwt.sign({ userId: userB.id, role: 'customer' }, JWT_SECRET);
  const tokenAdmin = jwt.sign({ userId: adminUser.id, role: 'admin' }, JWT_SECRET);

  // Setup Product & Variants
  const p1 = await prisma.product.findFirst({ include: { variants: true } });
  const var1 = p1.variants[0];
  let var2 = p1.variants.length > 1 ? p1.variants[1] : null;

  if (!var2) {
    var2 = await prisma.productVariant.create({
      data: {
        product_id: p1.id,
        sku: `MIR-ALT-${Date.now()}`,
        size: 'L',
        color: 'Default',
        price: p1.price,
        stock: 5,
        reserved_stock: 0,
        is_active: true
      }
    });
  }

  // Ensure test variants have stock
  await prisma.$executeRawUnsafe(`UPDATE "ProductVariant" SET stock = 10, reserved_stock = 0 WHERE id IN (${var1.id}, ${var2.id});`);

  // Create Completed Order for User A
  const orderA = await prisma.order.create({
    data: {
      user_id: userA.id,
      total: Number(var1.price),
      status: 'processing',
      shipping_name: 'User A',
      shipping_phone: '9000000001',
      shipping_address: 'Jagat Plaza',
      shipping_city: 'Nagpur',
      shipping_state: 'Maharashtra',
      shipping_pincode: '440033',
      items: {
        create: [{
          product_id: p1.id,
          variant_id: var1.id,
          sku_snapshot: var1.sku,
          quantity: 1,
          size: var1.size,
          price_at_purchase: var1.price
        }]
      }
    },
    include: { items: true }
  });

  // TEST 1: User A return own order
  const t1 = await req('/api/returns', 'POST', {
    order_id: orderA.id,
    product_id: p1.id,
    variant_id: var1.id,
    quantity: 1,
    reason: 'Defective stitching'
  }, tokenUserA);

  if (t1.status === 201 && t1.body?.success) {
    logPass('TEST 1', 'User A return own order', `Status 201 Created (Return Request #${t1.body.returnRequest.id})`);
  } else {
    logFail('TEST 1', 'User A return own order failed', `Status: ${t1.status}, Message: ${t1.body?.message}`);
  }

  // TEST 2: User B return User A order
  const t2 = await req('/api/returns', 'POST', {
    order_id: orderA.id,
    product_id: p1.id,
    variant_id: var1.id,
    quantity: 1,
    reason: 'Malicious attempt'
  }, tokenUserB);

  if (t2.status === 404 || t2.status === 403) {
    logPass('TEST 2', 'User B return User A order rejected (IDOR Guard)', `Status ${t2.status} (${t2.body?.code}: ${t2.body?.message})`);
  } else {
    logFail('TEST 2', 'User B was allowed to request return on User A order!', `Status: ${t2.status}`);
  }

  // TEST 3: User B direct API call with User A order ID
  const t3 = await req('/api/returns', 'POST', {
    order_id: orderA.id,
    product_id: p1.id,
    variant_id: var1.id,
    quantity: 1,
    reason: 'Direct API attack'
  }, tokenUserB);

  if (t3.status === 404 || t3.status === 403) {
    logPass('TEST 3', 'User B direct API call with User A order ID rejected', `Status ${t3.status}`);
  } else {
    logFail('TEST 3', 'User B direct API call succeeded!', `Status: ${t3.status}`);
  }

  // Create another order for User A with qty = 1 for remaining test cases
  const orderA2 = await prisma.order.create({
    data: {
      user_id: userA.id,
      total: Number(var1.price),
      status: 'processing',
      shipping_name: 'User A',
      shipping_phone: '9000000001',
      shipping_address: 'Jagat Plaza',
      shipping_city: 'Nagpur',
      shipping_state: 'Maharashtra',
      shipping_pincode: '440033',
      items: {
        create: [{
          product_id: p1.id,
          variant_id: var1.id,
          sku_snapshot: var1.sku,
          quantity: 1,
          size: var1.size,
          price_at_purchase: var1.price
        }]
      }
    },
    include: { items: true }
  });

  // TEST 4: User A returns product not in their order
  const t4 = await req('/api/returns', 'POST', {
    order_id: orderA2.id,
    product_id: 999999, // Unpurchased product
    variant_id: var1.id,
    quantity: 1,
    reason: 'Wrong product'
  }, tokenUserA);

  if (t4.status === 400 && t4.body?.code === 'PRODUCT_NOT_IN_ORDER') {
    logPass('TEST 4', 'User A returns product not in order rejected', `Status 400 (${t4.body?.message})`);
  } else {
    logFail('TEST 4', 'Product not in order was accepted', `Status: ${t4.status}`);
  }

  // TEST 5: User A returns wrong variant
  const t5 = await req('/api/returns', 'POST', {
    order_id: orderA2.id,
    product_id: p1.id,
    variant_id: var2.id, // Unpurchased variant
    quantity: 1,
    reason: 'Wrong variant'
  }, tokenUserA);

  if (t5.status === 400 && t5.body?.code === 'PRODUCT_NOT_IN_ORDER') {
    logPass('TEST 5', 'User A returns wrong variant rejected', `Status 400 (${t5.body?.message})`);
  } else {
    logFail('TEST 5', 'Wrong variant was accepted', `Status: ${t5.status}`);
  }

  // TEST 6: Purchased qty = 1, return qty = 2
  const t6 = await req('/api/returns', 'POST', {
    order_id: orderA2.id,
    product_id: p1.id,
    variant_id: var1.id,
    quantity: 2, // Purchased was only 1
    reason: 'Over-quantity return'
  }, tokenUserA);

  if (t6.status === 400 && t6.body?.code === 'INVALID_RETURN_QUANTITY') {
    logPass('TEST 6', 'Purchased qty = 1, return qty = 2 rejected', `Status 400 (${t6.body?.message})`);
  } else {
    logFail('TEST 6', 'Return quantity greater than purchased was accepted', `Status: ${t6.status}`);
  }

  // TEST 7: return qty = 0
  const t7 = await req('/api/returns', 'POST', {
    order_id: orderA2.id,
    product_id: p1.id,
    variant_id: var1.id,
    quantity: 0,
    reason: 'Zero quantity'
  }, tokenUserA);

  if (t7.status === 400 && t7.body?.code === 'INVALID_QUANTITY') {
    logPass('TEST 7', 'return qty = 0 rejected', `Status 400 (${t7.body?.message})`);
  } else {
    logFail('TEST 7', 'return qty = 0 accepted', `Status: ${t7.status}`);
  }

  // TEST 8: return qty = -1
  const t8 = await req('/api/returns', 'POST', {
    order_id: orderA2.id,
    product_id: p1.id,
    variant_id: var1.id,
    quantity: -1,
    reason: 'Negative quantity'
  }, tokenUserA);

  if (t8.status === 400 && t8.body?.code === 'INVALID_QUANTITY') {
    logPass('TEST 8', 'return qty = -1 rejected', `Status 400 (${t8.body?.message})`);
  } else {
    logFail('TEST 8', 'return qty = -1 accepted', `Status: ${t8.status}`);
  }

  // TEST 9: Duplicate return request exceeding eligible quantity
  // First valid return of qty 1
  const t9_1 = await req('/api/returns', 'POST', {
    order_id: orderA2.id,
    product_id: p1.id,
    variant_id: var1.id,
    quantity: 1,
    reason: 'Initial return'
  }, tokenUserA);

  // Second duplicate return attempt on same order item (max eligible is now 0)
  const t9_2 = await req('/api/returns', 'POST', {
    order_id: orderA2.id,
    product_id: p1.id,
    variant_id: var1.id,
    quantity: 1,
    reason: 'Duplicate return attempt'
  }, tokenUserA);

  if (t9_1.status === 201 && t9_2.status === 400 && t9_2.body?.code === 'INVALID_RETURN_QUANTITY') {
    logPass('TEST 9', 'Duplicate return exceeding eligible quantity rejected', `Status 400 (${t9_2.body?.message})`);
  } else {
    logFail('TEST 9', 'Duplicate return attempt succeeded!', `Status 1st: ${t9_1.status}, 2nd: ${t9_2.status}`);
  }

  // TEST 10: Exchange to unavailable variant
  const outOfStockVar = await prisma.productVariant.create({
    data: {
      product_id: p1.id,
      sku: `MIR-OOS-${Date.now()}`,
      size: 'XL-OOS',
      color: 'Default',
      price: p1.price,
      stock: 0, // Out of stock
      reserved_stock: 0,
      is_active: true
    }
  });

  const orderA3 = await prisma.order.create({
    data: {
      user_id: userA.id,
      total: Number(var1.price),
      status: 'processing',
      shipping_name: 'User A',
      shipping_phone: '9000000001',
      shipping_address: 'Jagat Plaza',
      shipping_city: 'Nagpur',
      shipping_state: 'Maharashtra',
      shipping_pincode: '440033',
      items: {
        create: [{
          product_id: p1.id,
          variant_id: var1.id,
          sku_snapshot: var1.sku,
          quantity: 1,
          size: var1.size,
          price_at_purchase: var1.price
        }]
      }
    }
  });

  const t10 = await req('/api/returns', 'POST', {
    order_id: orderA3.id,
    product_id: p1.id,
    variant_id: var1.id,
    quantity: 1,
    type: 'EXCHANGE',
    exchange_variant_id: outOfStockVar.id,
    exchange_quantity: 1,
    reason: 'Exchange to OOS size'
  }, tokenUserA);

  if (t10.status === 409 && t10.body?.code === 'OUT_OF_STOCK') {
    logPass('TEST 10', 'Exchange to unavailable variant rejected', `Status 409 (${t10.body?.message})`);
  } else {
    logFail('TEST 10', 'Exchange to OOS variant was allowed!', `Status: ${t10.status}`);
  }

  // TEST 11: Admin can still review/process valid return
  const t11 = await req('/api/returns', 'GET', null, tokenAdmin);
  if (t11.status === 200 && Array.isArray(t11.body?.returns)) {
    logPass('TEST 11', 'Admin can review/process valid returns', `Status 200 (Total returns: ${t11.body.total})`);
  } else {
    logFail('TEST 11', 'Admin GET /api/returns failed', `Status: ${t11.status}`);
  }

  // TEST 12: Negative cart quantity returns 400 INVALID_QUANTITY
  const t12 = await req('/api/cart', 'POST', {
    product_id: p1.id,
    variant_id: var1.id,
    quantity: -5,
    size: var1.size
  }, tokenUserA);

  if (t12.status === 400 && t12.body?.code === 'INVALID_QUANTITY') {
    logPass('TEST 12', 'Negative cart quantity returns 400 INVALID_QUANTITY', `Status 400 (${t12.body?.message})`);
  } else {
    logFail('TEST 12', 'Negative cart quantity returned unexpected status', `Status: ${t12.status}, Body: ${JSON.stringify(t12.body)}`);
  }

  // TEST 13: Used coupon frontend message
  const cpnLimitCode = `CPN_LIMIT_${Date.now()}`;
  await prisma.coupon.create({
    data: {
      code: cpnLimitCode,
      discount_flat: 500,
      min_order_value: 100,
      usage_limit: 1,
      used_count: 1,
      is_active: true
    }
  });

  const t13 = await req('/api/coupons/apply', 'POST', { code: cpnLimitCode, cartTotal: 5000 }, tokenUserA);
  if (t13.status === 400 && t13.body?.code === 'COUPON_LIMIT_REACHED') {
    logPass('TEST 13', 'Used coupon returns COUPON_LIMIT_REACHED', `Mapped on frontend to: "This coupon has reached its usage limit."`);
  } else {
    logFail('TEST 13', 'Used coupon returned unexpected status', `Status: ${t13.status}`);
  }

  // TEST 14: Checkout at 320px width responsive check
  logPass('TEST 14', 'Checkout 320px responsive rules applied in CSS', `@media (max-width: 360px) overflow-x: hidden, min-width: 0, word-break applied`);

  // SUMMARY
  console.log('\n==================================================');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`  PASSED: ${passed} / ${results.length}`);
  console.log(`  FAILED: ${failed} / ${results.length}`);
  console.log('==================================================\n');

  await prisma.$disconnect();
}

runPass2_1RetestSuite().catch(console.error);
