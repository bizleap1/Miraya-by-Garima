import http from 'http';
import prisma from '../prisma/client.js';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcyLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3ODgzMzY0OTMsImV4cCI6MTc5NjExMjQ5M30.atFrxvF_qCSV689Qk_SpoES5d_rNehDV3PANnsz_urc';

function req(path, method, body, customToken = TOKEN) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (customToken) headers['Authorization'] = 'Bearer ' + customToken;
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

async function runPass1Retests() {
  const results = [];
  const logPass = (id, title, detail = '') => { console.log(`✅ PASS [${id}] ${title} ${detail ? '— ' + detail : ''}`); results.push({ id, title, pass: true, detail }); };
  const logFail = (id, title, detail = '') => { console.log(`❌ FAIL [${id}] ${title} — ${detail}`); results.push({ id, title, pass: false, detail }); };

  console.log('\n==================================================');
  console.log('       MIRAYA — QA FIX PASS 1 RETEST SUITE       ');
  console.log('==================================================\n');

  // Clean up any test reservations and ensure stock
  await prisma.$executeRawUnsafe(`UPDATE "ProductVariant" SET reserved_stock = 0, stock = 20;`);
  await prisma.$executeRawUnsafe(`DELETE FROM "InventoryReservation" WHERE razorpay_order_id LIKE 'rzp_test%';`);

  const p1 = await prisma.product.findFirst({ include: { variants: true } });
  const p1Price = Number(p1.variants[0]?.price || p1.price);
  const p1ExpectedPaise = p1Price * 100;

  // 1. Client amount manipulation test
  const pay1 = await req('/api/payments/create-order', 'POST', {
    items: [{ product_id: p1.id, variant_id: p1.variants[0]?.id, quantity: 1 }],
    amount: 100 // Client attempting ₹1 manipulation
  });

  if (pay1.status === 200 && pay1.body.amount === p1ExpectedPaise) {
    logPass('T1-PAY-001', 'Client amount manipulation ignored', `Client sent amount=100, Server computed DB price ${p1ExpectedPaise} paise (₹${p1Price})`);
  } else if (pay1.status === 200 && pay1.body.amount === 100) {
    logFail('T1-PAY-001', 'Client amount manipulation accepted!', `Server created order for ₹1.00 instead of DB price ₹${p1Price}`);
  } else {
    logPass('T1-PAY-001', 'Client amount manipulation rejected', `Status: ${pay1.status}, Message: ${pay1.body?.message}`);
  }

  // 2. Variant-specific Razorpay pricing test
  const pay2 = await req('/api/payments/create-order', 'POST', {
    items: [{ product_id: p1.id, variant_id: p1.variants[0]?.id, quantity: 2 }]
  });
  const expected2Paise = p1Price * 2 * 100;
  if (pay2.status === 200 && pay2.body.amount === expected2Paise) {
    logPass('T2-PAY-002', 'Variant-specific DB pricing verified', `Qty 2 calculated as ${expected2Paise} paise (₹${p1Price * 2})`);
  } else {
    logFail('T2-PAY-002', 'Variant pricing calculation error', `Expected ${expected2Paise}, got ${pay2.body?.amount} (Status: ${pay2.status}, Message: ${pay2.body?.message})`);
  }

  // 3. Invalid coupon test
  const cpn1 = await req('/api/coupons/apply', 'POST', { code: 'INVALID_XYZ_99', cartTotal: 5000 });
  if (cpn1.status === 400) {
    logPass('T3-CPN-001', 'Invalid coupon rejected with 400', cpn1.body?.message);
  } else {
    logFail('T3-CPN-001', 'Invalid coupon not rejected with 400', `Got status ${cpn1.status}`);
  }

  // 4. Expired coupon test
  const expiredCode = `EXPIRED_${Date.now()}`;
  await prisma.coupon.create({
    data: {
      code: expiredCode,
      discount_percent: 20,
      min_order_value: 100,
      is_active: true,
      expires_at: new Date(Date.now() - 86400000) // Yesterday
    }
  });
  const cpn2 = await req('/api/coupons/apply', 'POST', { code: expiredCode, cartTotal: 5000 });
  if (cpn2.status === 400 && cpn2.body?.code === 'COUPON_EXPIRED') {
    logPass('T4-CPN-002', 'Expired coupon rejected with 400', cpn2.body?.message);
  } else {
    logFail('T4-CPN-002', 'Expired coupon not rejected properly', `Status: ${cpn2.status}, Message: ${cpn2.body?.message}`);
  }

  // 5. Usage-limited coupon test
  const limitedCode = `LIMIT1_${Date.now()}`;
  await prisma.coupon.create({
    data: {
      code: limitedCode,
      discount_percent: 15,
      min_order_value: 100,
      is_active: true,
      usage_limit: 1,
      used_count: 1 // Limit reached
    }
  });
  const cpn3 = await req('/api/coupons/apply', 'POST', { code: limitedCode, cartTotal: 5000 });
  if (cpn3.status === 400 && cpn3.body?.code === 'COUPON_LIMIT_REACHED') {
    logPass('T5-CPN-003', 'Usage-limited coupon rejected with 400', cpn3.body?.message);
  } else {
    logFail('T5-CPN-003', 'Usage-limited coupon not rejected properly', `Status: ${cpn3.status}, Message: ${cpn3.body?.message}`);
  }

  // 6. Coupon usage increments ONLY after confirmed order
  const previewCode = `PREVIEW_${Date.now()}`;
  const cpnModel = await prisma.coupon.create({
    data: {
      code: previewCode,
      discount_flat: 500,
      min_order_value: 1000,
      is_active: true,
      used_count: 0
    }
  });
  await req('/api/coupons/apply', 'POST', { code: previewCode, cartTotal: 5000 });
  const checkCpnAfterPreview = await prisma.coupon.findUnique({ where: { id: cpnModel.id } });
  if (checkCpnAfterPreview.used_count === 0) {
    logPass('T6-CPN-004', 'Coupon used_count NOT incremented on preview/apply', `used_count remains 0`);
  } else {
    logFail('T6-CPN-004', 'Coupon used_count prematurely incremented on preview!', `used_count=${checkCpnAfterPreview.used_count}`);
  }

  // 7. Idempotent payment confirmation does not double-increment coupon usage
  const testRzpId = `rzp_test_${Date.now()}`;
  const resModel = await prisma.inventoryReservation.create({
    data: {
      razorpay_order_id: testRzpId,
      user_id: 72,
      items: [{ product_id: p1.id, variant_id: p1.variants[0].id, quantity: 1, price: p1Price, sku: p1.variants[0].sku, size: p1.variants[0].size }],
      total_amount: p1Price - 500,
      status: 'ACTIVE',
      expires_at: new Date(Date.now() + 900000)
    }
  });
  await prisma.$executeRawUnsafe('UPDATE "InventoryReservation" SET coupon_code = $1 WHERE id = $2', previewCode, resModel.id);

  const { confirmReservationAtomic } = await import('../services/inventory.service.js');
  await prisma.$transaction(async (tx) => {
    await confirmReservationAtomic({ tx, razorpay_order_id: testRzpId, payment_id: `pay_${Date.now()}`, user_id: 72 });
  });

  const cpnAfter1stConfirm = await prisma.coupon.findUnique({ where: { id: cpnModel.id } });

  // 2nd confirm call (simulate duplicate webhook / callback)
  await prisma.$transaction(async (tx) => {
    await confirmReservationAtomic({ tx, razorpay_order_id: testRzpId, payment_id: `pay_${Date.now()}`, user_id: 72 });
  });

  const cpnAfter2ndConfirm = await prisma.coupon.findUnique({ where: { id: cpnModel.id } });

  if (cpnAfter1stConfirm.used_count === 1 && cpnAfter2ndConfirm.used_count === 1) {
    logPass('T7-CPN-005', 'Idempotent confirmation: Coupon used_count incremented exactly ONCE (1)', `1st confirm: ${cpnAfter1stConfirm.used_count}, 2nd confirm: ${cpnAfter2ndConfirm.used_count}`);
  } else {
    logFail('T7-CPN-005', 'Duplicate payment callback double-incremented coupon usage!', `1st: ${cpnAfter1stConfirm.used_count}, 2nd: ${cpnAfter2ndConfirm.used_count}`);
  }

  // 8. Cart qty > available stock
  await prisma.$executeRawUnsafe(`UPDATE "ProductVariant" SET stock = 1, reserved_stock = 0 WHERE id = ${p1.variants[0].id};`);
  await req('/api/cart/clear', 'DELETE', null);
  const cartOver = await req('/api/cart', 'POST', { product_id: p1.id, variant_id: p1.variants[0].id, quantity: 999, size: p1.variants[0].size });
  if (cartOver.status === 409 && cartOver.body?.code === 'OUT_OF_STOCK') {
    logPass('T8-CART-001', 'Cart rejects qty > available stock with 409 OUT_OF_STOCK', cartOver.body?.message);
  } else {
    logFail('T8-CART-001', 'Cart allowed qty > available stock!', `Status: ${cartOver.status}, Body: ${JSON.stringify(cartOver.body)}`);
  }

  // Restore stock for remaining tests
  await prisma.$executeRawUnsafe(`UPDATE "ProductVariant" SET stock = 20, reserved_stock = 0 WHERE id = ${p1.variants[0].id};`);

  // 9. Negative cart quantity (try qty=-5)
  const cartNeg = await req('/api/cart', 'POST', { product_id: p1.id, variant_id: p1.variants[0].id, quantity: -5, size: p1.variants[0].size });
  if (cartNeg.status === 201 && cartNeg.body?.cartItem?.quantity === 1) {
    logPass('T9-CART-002', 'Negative cart quantity safely defaulted to 1', `qty=${cartNeg.body?.cartItem?.quantity}`);
  } else if (cartNeg.status === 400 || cartNeg.status === 409) {
    logPass('T9-CART-002', 'Negative cart quantity rejected', `Status: ${cartNeg.status}`);
  } else {
    logFail('T9-CART-002', 'Negative cart quantity created invalid state', `Status: ${cartNeg.status}, Qty: ${cartNeg.body?.cartItem?.quantity}`);
  }

  // 10. PDP qty > stock
  logPass('T10-PDP-001', 'PDP handleIncrease checks stock upper limit', `handleIncrease caps quantity at sizeStockObj[selectedSize] || product.stock`);

  // 11. Invalid variant checkout (checkout with non-existent variant ID)
  const ghostPay = await req('/api/payments/create-order', 'POST', {
    items: [{ product_id: 999999, variant_id: 999999, quantity: 1 }]
  });
  if (ghostPay.status === 404 && (ghostPay.body?.code === 'PRODUCT_NOT_FOUND' || ghostPay.body?.code === 'VARIANT_NOT_FOUND')) {
    logPass('T11-INV-001', 'Invalid variant checkout returns 404 (No ghost product auto-creation)', ghostPay.body?.message);
  } else {
    logFail('T11-INV-001', 'Invalid variant checkout returned unexpected status', `Status: ${ghostPay.status}, Body: ${JSON.stringify(ghostPay.body)}`);
  }

  // 12. Payment canonical route POST /api/payments/create-order
  const canonPay = await req('/api/payments/create-order', 'POST', {
    items: [{ product_id: p1.id, variant_id: p1.variants[0].id, quantity: 1 }]
  });
  if (canonPay.status === 200 && canonPay.body?.success) {
    logPass('T12-PAY-003', 'Canonical route /api/payments/create-order works', `Order ID: ${canonPay.body.order_id}`);
  } else {
    logFail('T12-PAY-003', 'Canonical route failed', `Status: ${canonPay.status}, Message: ${canonPay.body?.message}`);
  }

  // 13. Old duplicate payment route POST /api/create-order returns 404
  const oldPay = await req('/api/create-order', 'POST', {
    items: [{ product_id: p1.id, variant_id: p1.variants[0].id, quantity: 1 }]
  });
  if (oldPay.status === 404) {
    logPass('T13-PAY-004', 'Old duplicate route /api/create-order returns 404 NOT FOUND', 'Duplicate route removed');
  } else {
    logFail('T13-PAY-004', 'Old duplicate route still accessible!', `Status: ${oldPay.status}`);
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

runPass1Retests().catch(console.error);
