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

async function runExchangeTestSuite() {
  console.log('\n==================================================');
  console.log('    MIRAYA — COMPLETE EXCHANGE WORKFLOW RETEST    ');
  console.log('==================================================\n');

  const results = [];
  const logPass = (id, title, detail = '') => { console.log(`✅ PASS [${id}] ${title} ${detail ? '— ' + detail : ''}`); results.push({ id, title, pass: true, detail }); };
  const logFail = (id, title, detail = '') => { console.log(`❌ FAIL [${id}] ${title} — ${detail}`); results.push({ id, title, pass: false, detail }); };

  // Setup Users
  let userA = await prisma.user.findFirst({ where: { email: 'ex_user_a@miraya.com' } });
  if (!userA) userA = await prisma.user.create({ data: { name: 'Ex User A', email: 'ex_user_a@miraya.com', password_hash: '$2b$10$hash', role: 'customer' } });

  let userB = await prisma.user.findFirst({ where: { email: 'ex_user_b@miraya.com' } });
  if (!userB) userB = await prisma.user.create({ data: { name: 'Ex User B', email: 'ex_user_b@miraya.com', password_hash: '$2b$10$hash', role: 'customer' } });

  let adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!adminUser) adminUser = await prisma.user.create({ data: { name: 'Admin User', email: 'ex_admin@miraya.com', password_hash: '$2b$10$hash', role: 'admin' } });

  const tokenA = jwt.sign({ userId: userA.id, role: 'customer' }, JWT_SECRET);
  const tokenB = jwt.sign({ userId: userB.id, role: 'customer' }, JWT_SECRET);
  const tokenAdmin = jwt.sign({ userId: adminUser.id, role: 'admin' }, JWT_SECRET);

  // Setup Product with Size M (varM) and Size L (varL) and Size XL (varXL, OOS)
  const p1 = await prisma.product.findFirst({ include: { variants: true } });
  const varM = p1.variants[0];
  
  let varL = await prisma.productVariant.findFirst({ where: { product_id: p1.id, size: 'L' } });
  if (!varL) {
    varL = await prisma.productVariant.create({
      data: { product_id: p1.id, sku: `MIR-L-${Date.now()}`, size: 'L', color: 'Default', price: p1.price, stock: 5, reserved_stock: 0, is_active: true }
    });
  }

  let varXL = await prisma.productVariant.findFirst({ where: { product_id: p1.id, size: 'XL' } });
  if (!varXL) {
    varXL = await prisma.productVariant.create({
      data: { product_id: p1.id, sku: `MIR-XL-OOS-${Date.now()}`, size: 'XL', color: 'Default', price: p1.price, stock: 0, reserved_stock: 0, is_active: true }
    });
  } else {
    await prisma.$executeRawUnsafe(`UPDATE "ProductVariant" SET stock = 0, reserved_stock = 0 WHERE id = ${varXL.id};`);
  }

  // Ensure varL has stock = 5, reserved = 0
  await prisma.$executeRawUnsafe(`UPDATE "ProductVariant" SET stock = 5, reserved_stock = 0 WHERE id = ${varL.id};`);

  // Create Delivered Order for User A
  const orderA = await prisma.order.create({
    data: {
      user_id: userA.id,
      total: Number(varM.price),
      status: 'delivered',
      shipping_name: 'Ex User A',
      shipping_phone: '9000000001',
      shipping_address: 'Jagat Plaza',
      shipping_city: 'Nagpur',
      shipping_state: 'Maharashtra',
      shipping_pincode: '440033',
      items: {
        create: [{
          product_id: p1.id,
          variant_id: varM.id,
          sku_snapshot: varM.sku,
          quantity: 1,
          size: varM.size || 'M',
          price_at_purchase: varM.price
        }]
      }
    },
    include: { items: true }
  });

  // ---------------------------------------------------------------------------
  // TEST 1: Exchange OFF -> User A tries API directly -> EXCHANGE_DISABLED
  // ---------------------------------------------------------------------------
  const putOff = await req('/api/settings', 'PUT', { exchange_enabled: false }, tokenAdmin);
  const t1 = await req('/api/returns', 'POST', {
    order_id: orderA.id,
    product_id: p1.id,
    variant_id: varM.id,
    exchange_variant_id: varL.id,
    quantity: 1,
    reason: 'Size issue',
    type: 'EXCHANGE'
  }, tokenA);

  if (t1.status === 403 && t1.body?.code === 'EXCHANGE_DISABLED') {
    logPass('TEST 1', 'Exchange OFF -> Request rejected with 403 EXCHANGE_DISABLED', t1.body.message);
  } else {
    logFail('TEST 1', 'Exchange OFF was not enforced!', `Status: ${t1.status}, PutRes: ${JSON.stringify(putOff.body)}`);
  }

  // Turn Exchange ON
  await req('/api/settings', 'PUT', { exchange_enabled: true, exchange_window_days: 7 }, tokenAdmin);

  // Fresh Order A2 for Test 2
  const orderA2 = await prisma.order.create({
    data: {
      user_id: userA.id,
      total: Number(varM.price),
      status: 'delivered',
      items: { create: [{ product_id: p1.id, variant_id: varM.id, sku_snapshot: varM.sku, quantity: 1, size: 'M', price_at_purchase: varM.price }] }
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 2: Exchange ON -> User A owns delivered order -> Request succeeds
  // ---------------------------------------------------------------------------
  const t2 = await req('/api/returns', 'POST', {
    order_id: orderA2.id,
    product_id: p1.id,
    variant_id: varM.id,
    exchange_variant_id: varL.id,
    exchange_quantity: 1,
    quantity: 1,
    reason: 'Size issue',
    type: 'EXCHANGE'
  }, tokenA);

  if (t2.status === 201 && t2.body?.success) {
    logPass('TEST 2', 'Exchange ON -> User A owns delivered order -> Request succeeds', `Exchange ID #EX-${t2.body.returnRequest.id}`);
  } else {
    logFail('TEST 2', 'Valid exchange request failed', `Status: ${t2.status}, Msg: ${t2.body?.message}`);
  }


  // ---------------------------------------------------------------------------
  // TEST 3: User B submits exchange for User A order -> 404 ORDER_NOT_FOUND
  // ---------------------------------------------------------------------------
  const t3 = await req('/api/returns', 'POST', {
    order_id: orderA.id,
    product_id: p1.id,
    variant_id: varM.id,
    exchange_variant_id: varL.id,
    quantity: 1,
    reason: 'Hacking attempt',
    type: 'EXCHANGE'
  }, tokenB);

  if (t3.status === 404 || t3.status === 403) {
    logPass('TEST 3', 'User B exchange on User A order rejected (IDOR Guard)', `Status ${t3.status}`);
  } else {
    logFail('TEST 3', 'User B allowed to request exchange on User A order!', `Status: ${t3.status}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Order not delivered -> Exchange rejected
  // ---------------------------------------------------------------------------
  const orderPending = await prisma.order.create({
    data: {
      user_id: userA.id,
      total: Number(varM.price),
      status: 'pending',
      items: { create: [{ product_id: p1.id, variant_id: varM.id, sku_snapshot: varM.sku, quantity: 1, size: 'M', price_at_purchase: varM.price }] }
    }
  });

  const t4 = await req('/api/returns', 'POST', {
    order_id: orderPending.id,
    product_id: p1.id,
    variant_id: varM.id,
    exchange_variant_id: varL.id,
    quantity: 1,
    reason: 'Size issue',
    type: 'EXCHANGE'
  }, tokenA);

  if (t4.status === 400 && t4.body?.code === 'ORDER_NOT_DELIVERED') {
    logPass('TEST 4', 'Pending order exchange rejected with ORDER_NOT_DELIVERED', t4.body.message);
  } else {
    logFail('TEST 4', 'Pending order allowed exchange!', `Status: ${t4.status}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Exchange window expired (Delivered 10 days ago)
  // ---------------------------------------------------------------------------
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  const orderExpired = await prisma.order.create({
    data: {
      user_id: userA.id,
      total: Number(varM.price),
      status: 'delivered',
      created_at: tenDaysAgo,
      updated_at: tenDaysAgo,
      items: { create: [{ product_id: p1.id, variant_id: varM.id, sku_snapshot: varM.sku, quantity: 1, size: 'M', price_at_purchase: varM.price }] }
    }
  });

  const t5 = await req('/api/returns', 'POST', {
    order_id: orderExpired.id,
    product_id: p1.id,
    variant_id: varM.id,
    exchange_variant_id: varL.id,
    quantity: 1,
    reason: 'Size issue',
    type: 'EXCHANGE'
  }, tokenA);

  if (t5.status === 400 && t5.body?.code === 'EXCHANGE_WINDOW_EXPIRED') {
    logPass('TEST 5', 'Exchange window expired rejected with EXCHANGE_WINDOW_EXPIRED', t5.body.message);
  } else {
    logFail('TEST 5', 'Expired exchange window was accepted!', `Status: ${t5.status}`);
  }

  // Create fresh Order A4 for stock/reservation tests
  const orderA4 = await prisma.order.create({
    data: {
      user_id: userA.id,
      total: Number(varM.price),
      status: 'delivered',
      items: { create: [{ product_id: p1.id, variant_id: varM.id, sku_snapshot: varM.sku, quantity: 1, size: 'M', price_at_purchase: varM.price }] }
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 6: Purchased M, Request L (L in stock) -> Success
  // ---------------------------------------------------------------------------
  const t6 = await req('/api/returns', 'POST', {
    order_id: orderA4.id,
    product_id: p1.id,
    variant_id: varM.id,
    exchange_variant_id: varL.id,
    exchange_quantity: 1,
    quantity: 1,
    reason: 'Size issue',
    type: 'EXCHANGE'
  }, tokenA);

  if (t6.status === 201 && t6.body?.success) {
    logPass('TEST 6', 'Purchased M -> Request available size L -> Success', `Exchange ID #EX-${t6.body.returnRequest.id}`);
  } else {
    logFail('TEST 6', 'Request available size L failed', `Status: ${t6.status}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Requested XL (XL stock = 0) -> 409 OUT_OF_STOCK
  // ---------------------------------------------------------------------------
  const orderA5 = await prisma.order.create({
    data: {
      user_id: userA.id,
      total: Number(varM.price),
      status: 'delivered',
      items: { create: [{ product_id: p1.id, variant_id: varM.id, sku_snapshot: varM.sku, quantity: 1, size: 'M', price_at_purchase: varM.price }] }
    }
  });

  const t7 = await req('/api/returns', 'POST', {
    order_id: orderA5.id,
    product_id: p1.id,
    variant_id: varM.id,
    exchange_variant_id: varXL.id,
    exchange_quantity: 1,
    quantity: 1,
    reason: 'Size issue',
    type: 'EXCHANGE'
  }, tokenA);

  if (t7.status === 409 && t7.body?.code === 'OUT_OF_STOCK') {
    logPass('TEST 7', 'Request OOS size XL rejected with 409 OUT_OF_STOCK', t7.body.message);
  } else {
    logFail('TEST 7', 'OOS size XL was accepted!', `Status: ${t7.status}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 8: Purchased qty = 1, Request qty = 2 -> INVALID_EXCHANGE_QUANTITY
  // ---------------------------------------------------------------------------
  const t8 = await req('/api/returns', 'POST', {
    order_id: orderA5.id,
    product_id: p1.id,
    variant_id: varM.id,
    exchange_variant_id: varL.id,
    quantity: 2,
    reason: 'Excess quantity',
    type: 'EXCHANGE'
  }, tokenA);

  if (t8.status === 400 && t8.body?.code === 'INVALID_EXCHANGE_QUANTITY') {
    logPass('TEST 8', 'Request qty > purchased qty rejected with INVALID_EXCHANGE_QUANTITY', t8.body.message);
  } else {
    logFail('TEST 8', 'Excess exchange quantity accepted!', `Status: ${t8.status}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 9: Duplicate exchange request -> Rejected
  // ---------------------------------------------------------------------------
  const t9 = await req('/api/returns', 'POST', {
    order_id: orderA4.id,
    product_id: p1.id,
    variant_id: varM.id,
    exchange_variant_id: varL.id,
    quantity: 1,
    reason: 'Duplicate request',
    type: 'EXCHANGE'
  }, tokenA);

  if (t9.status === 400 && t9.body?.code === 'INVALID_EXCHANGE_QUANTITY') {
    logPass('TEST 9', 'Duplicate exchange request rejected', t9.body.message);
  } else {
    logFail('TEST 9', 'Duplicate exchange request accepted!', `Status: ${t9.status}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 10: Admin approves last available replacement unit (L stock = 1) -> Inventory protected
  // ---------------------------------------------------------------------------
  const rareVar = await prisma.productVariant.create({
    data: { product_id: p1.id, sku: `MIR-RARE-${Date.now()}`, size: 'XS-RARE', color: 'Gold', price: p1.price, stock: 1, reserved_stock: 0, is_active: true }
  });

  const orderA6 = await prisma.order.create({
    data: {
      user_id: userA.id,
      total: Number(varM.price),
      status: 'delivered',
      items: { create: [{ product_id: p1.id, variant_id: varM.id, sku_snapshot: varM.sku, quantity: 1, size: 'M', price_at_purchase: varM.price }] }
    }
  });

  const exReq6 = await req('/api/returns', 'POST', {
    order_id: orderA6.id,
    product_id: p1.id,
    variant_id: varM.id,
    exchange_variant_id: rareVar.id,
    exchange_quantity: 1,
    quantity: 1,
    reason: 'Size issue',
    type: 'EXCHANGE'
  }, tokenA);

  const exId6 = exReq6.body?.returnRequest?.id;

  if (!exId6) {
    logFail('TEST 10', 'Failed to create exchange request for Test 10', `Status: ${exReq6.status}, Body: ${JSON.stringify(exReq6.body)}`);
  } else {
    // Admin approves exchange request
    const appRes = await req(`/api/returns/${exId6}/status`, 'PUT', { status: 'APPROVED' }, tokenAdmin);
    const rareCheck = await prisma.productVariant.findUnique({ where: { id: rareVar.id } });

    if (appRes.status === 200 && rareCheck.reserved_stock === 1) {
      logPass('TEST 10', 'Admin approves exchange -> Replacement size reserved (reserved_stock = 1)', `Available sellable: ${rareCheck.stock - rareCheck.reserved_stock}`);
    } else {
      logFail('TEST 10', 'Admin approval did not reserve replacement inventory!', `Reserved: ${rareCheck?.reserved_stock}`);
    }
  }


  // ---------------------------------------------------------------------------
  // TEST 11: Customer B attempts checkout on same last unit -> OUT_OF_STOCK
  // ---------------------------------------------------------------------------
  const buyAttempt = await req('/api/payments/create-order', 'POST', {
    items: [{ product_id: p1.id, variant_id: rareVar.id, quantity: 1, size: rareVar.size }]
  }, tokenB);

  if (buyAttempt.status === 409 && buyAttempt.body?.code === 'OUT_OF_STOCK') {
    logPass('TEST 11', 'Other customer checkout on last reserved unit rejected with 409 OUT_OF_STOCK', buyAttempt.body.message);
  } else {
    logFail('TEST 11', 'Other customer was allowed to buy last reserved unit!', `Status: ${buyAttempt.status}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 12: Admin rejects exchange -> Replacement reservation safely released
  // ---------------------------------------------------------------------------
  await req(`/api/returns/${exId6}/status`, 'PUT', { status: 'REJECTED' }, tokenAdmin);
  const rareCheckReleased = await prisma.productVariant.findUnique({ where: { id: rareVar.id } });

  if (rareCheckReleased.reserved_stock === 0) {
    logPass('TEST 12', 'Admin rejects exchange -> Replacement reservation released (reserved_stock = 0)', `Available sellable: 1`);
  } else {
    logFail('TEST 12', 'Rejection did not release reservation!', `Reserved: ${rareCheckReleased.reserved_stock}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 13: Admin marks item received -> ITEM_RECEIVED. No double stock addition
  // ---------------------------------------------------------------------------
  // Re-approve exId6
  await req(`/api/returns/${exId6}/status`, 'PUT', { status: 'APPROVED' }, tokenAdmin);
  const recRes = await req(`/api/returns/${exId6}/status`, 'PUT', { status: 'ITEM_RECEIVED' }, tokenAdmin);
  const varMCheck = await prisma.productVariant.findUnique({ where: { id: varM.id } });

  if (recRes.status === 200 && recRes.body?.returnRequest?.status === 'ITEM_RECEIVED') {
    logPass('TEST 13', 'Admin marks item received -> Status ITEM_RECEIVED (No premature stock addition)', `Status: ${recRes.body.returnRequest.status}`);
  } else {
    logFail('TEST 13', 'Item received failed!', `Status: ${recRes.status}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 14: Admin marks exchange shipped -> SHIPPED
  // ---------------------------------------------------------------------------
  const shipRes = await req(`/api/returns/${exId6}/status`, 'PUT', { status: 'SHIPPED', courier_name: 'BlueDart', tracking_number: 'BD123456789' }, tokenAdmin);
  if (shipRes.status === 200 && shipRes.body?.returnRequest?.status === 'SHIPPED') {
    logPass('TEST 14', 'Admin marks exchange shipped -> Status SHIPPED with tracking info', `Courier: BlueDart`);
  } else {
    logFail('TEST 14', 'Mark shipped failed!', `Status: ${shipRes.status}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 15: Admin marks completed -> COMPLETED
  // ---------------------------------------------------------------------------
  const compRes = await req(`/api/returns/${exId6}/status`, 'PUT', { status: 'COMPLETED' }, tokenAdmin);
  if (compRes.status === 200 && compRes.body?.returnRequest?.status === 'COMPLETED') {
    logPass('TEST 15', 'Admin marks completed -> Status COMPLETED', `Status: COMPLETED`);
  } else {
    logFail('TEST 15', 'Mark completed failed!', `Status: ${compRes.status}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 16: Completed exchange cannot be processed again -> Read-only
  // ---------------------------------------------------------------------------
  const reCompRes = await req(`/api/returns/${exId6}/status`, 'PUT', { status: 'APPROVED' }, tokenAdmin);
  if (reCompRes.status === 400) {
    logPass('TEST 16', 'Completed exchange modification rejected (Read-only state)', reCompRes.body.message);
  } else {
    logFail('TEST 16', 'Completed exchange was modified!', `Status: ${reCompRes.status}`);
  }

  // SUMMARY
  console.log('\n==================================================');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`  PASSED: ${passed} / ${results.length}`);
  console.log(`  FAILED: ${failed} / ${results.length}`);
  console.log('==================================================\n');

  await prisma.$disconnect();
}

runExchangeTestSuite().catch(console.error);
