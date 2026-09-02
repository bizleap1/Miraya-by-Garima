import http from 'http';
import prisma from '../prisma/client.js';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcyLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3ODgzMzY0OTMsImV4cCI6MTc5NjExMjQ5M30.atFrxvF_qCSV689Qk_SpoES5d_rNehDV3PANnsz_urc';

function req(path, method, body, noAuth = false) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (!noAuth) headers['Authorization'] = 'Bearer ' + TOKEN;
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

async function runTests() {
  const results = [];
  const pass = (id, title) => { console.log(`✅ PASS [${id}] ${title}`); results.push({ id, title, pass: true }); };
  const fail = (id, title, detail) => { console.log(`❌ FAIL [${id}] ${title} — ${detail}`); results.push({ id, title, pass: false, detail }); };
  const warn = (id, title, detail) => { console.log(`⚠️  WARN [${id}] ${title} — ${detail}`); results.push({ id, title, pass: null, detail }); };

  console.log('\n===== MIRAYA QA API TEST SUITE =====\n');

  // ─── HEALTH CHECK ────────────────────────────────────────────────────────────
  const health = await req('/health', 'GET', null, true);
  health.status === 200 ? pass('HC-001', 'Backend health check') : fail('HC-001', 'Backend health check', `Status ${health.status}`);

  // ─── AUTH TESTS ───────────────────────────────────────────────────────────────
  const dupReg = await req('/api/auth/register', 'POST', { name: 'Dup', email: 'qa_test_9821@mirayatest.com', password: 'Pass123!', phone: '9001' }, true);
  dupReg.status === 400 ? pass('AUTH-001', 'Duplicate email rejected') : fail('AUTH-001', 'Duplicate email rejected', `Got ${dupReg.status}: ${JSON.stringify(dupReg.body)}`);

  const wrongPass = await req('/api/auth/login', 'POST', { email: 'qa_test_9821@mirayatest.com', password: 'WrongPass' }, true);
  wrongPass.status === 401 ? pass('AUTH-002', 'Wrong password returns 401') : fail('AUTH-002', 'Wrong password returns 401', `Got ${wrongPass.status}`);

  const noToken = await req('/api/cart', 'GET', null, true);
  noToken.status === 401 ? pass('AUTH-003', 'Missing token returns 401') : fail('AUTH-003', 'Missing token returns 401', `Got ${noToken.status}`);

  const badToken = await req('/api/cart', 'GET', null, false);  // use modified invalid token
  // Replace last char to invalidate
  const INVALID_TOKEN = TOKEN.slice(0, -5) + 'XXXXX';
  const badTkRes = await new Promise(resolve => {
    const headers = { 'Authorization': 'Bearer ' + INVALID_TOKEN, 'Content-Type': 'application/json' };
    const r = http.request({ hostname: 'localhost', port: 5000, path: '/api/cart', method: 'GET', headers }, (res) => {
      let b = ''; res.on('data', d => b += d); res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    r.end();
  });
  badTkRes.status === 401 ? pass('AUTH-004', 'Invalid JWT token returns 401') : fail('AUTH-004', 'Invalid JWT token returns 401', `Got ${badTkRes.status}`);

  // ─── ROLE SECURITY ────────────────────────────────────────────────────────────
  const adminOrders = await req('/api/orders/all', 'GET', null, false);
  adminOrders.status === 403 ? pass('SEC-001', 'Customer cannot access /api/orders/all') : fail('SEC-001', 'Customer cannot access /api/orders/all', `Got ${adminOrders.status}`);

  const adminStats = await req('/api/stats', 'GET', null, false);
  adminStats.status === 403 ? pass('SEC-002', 'Customer cannot access /api/stats') : warn('SEC-002', 'Customer accessing /api/stats', `Got ${adminStats.status} - check if stats are public`);

  const updateOrderStatus = await req('/api/orders/1/status', 'PUT', { status: 'cancelled' }, false);
  (updateOrderStatus.status === 403 || updateOrderStatus.status === 404 || updateOrderStatus.status === 401) 
    ? pass('SEC-003', 'Customer cannot update order status') 
    : fail('SEC-003', 'Customer cannot update order status', `Got ${updateOrderStatus.status}: ${JSON.stringify(updateOrderStatus.body).slice(0, 100)}`);

  // ─── CART TESTS ───────────────────────────────────────────────────────────────
  // Clear cart first
  await req('/api/cart/clear', 'DELETE', null, false);

  const addCart = await req('/api/cart', 'POST', { product_id: 1, quantity: 1, size: 'Free Size (M to XL)' }, false);
  addCart.status === 201 ? pass('CART-001', 'Add item to cart') : fail('CART-001', 'Add item to cart', `Got ${addCart.status}: ${JSON.stringify(addCart.body).slice(0, 100)}`);

  // CRITICAL: Check if cart allows qty > stock (stock=1, try qty=999)
  const overQtyCart = await req('/api/cart', 'POST', { product_id: 1, quantity: 999, size: 'Free Size (M to XL)' }, false);
  // Cart controller doesn't validate against stock — this is a BUG
  console.log(`[CART-002] Add qty=999 to cart (stock=1): Status=${overQtyCart.status}`);
  if (overQtyCart.status === 200 || overQtyCart.status === 201) {
    fail('CART-002', 'Cart should reject qty > stock', `Cart allows qty=999 when stock=1 — P1 BUG: no stock validation at cart layer`);
  } else {
    pass('CART-002', 'Cart rejects qty > stock');
  }

  const getCart = await req('/api/cart', 'GET', null, false);
  console.log(`[CART-003] GET cart: Status=${getCart.status}, Items=${getCart.body?.length}`);
  getCart.status === 200 ? pass('CART-003', 'Get cart returns 200') : fail('CART-003', 'Get cart returns 200', `Got ${getCart.status}`);

  // ─── PAYMENT SECURITY ─────────────────────────────────────────────────────────
  const priceManipulation = await req('/api/payments/create-order', 'POST', { amount: 100, currency: 'INR' }, false);
  if (priceManipulation.status === 200) {
    const amountUsed = priceManipulation.body.amount;
    // If server accepted our 100 paise value without recalculating from cart/DB, it's a vulnerability
    if (amountUsed === 100) {
      warn('PAY-001', 'Price manipulation test — server accepted client amount=100 paise', 'Server trusts client-supplied amount when no items provided. Check if checkout flow always uses items.');
    } else {
      pass('PAY-001', 'Server recalculates amount from DB');
    }
  } else {
    pass('PAY-001', `Server rejected direct amount < minimum (status ${priceManipulation.status})`);
  }

  // CRITICAL: payment verify with fake signature
  const fakeVerify = await req('/api/payments/verify', 'POST', { razorpay_order_id: 'order_fake123', razorpay_payment_id: 'pay_fake456', razorpay_signature: 'fakesignature123' }, false);
  fakeVerify.status === 400 && fakeVerify.body?.code === 'INVALID_SIGNATURE'
    ? pass('PAY-002', 'Fake payment signature rejected') 
    : fail('PAY-002', 'Fake payment signature rejected', `Got ${fakeVerify.status}: ${JSON.stringify(fakeVerify.body).slice(0, 200)}`);

  // ─── COUPON TESTS ─────────────────────────────────────────────────────────────
  const invalidCoupon = await req('/api/coupons/apply', 'POST', { code: 'INVALID999XYZ', cartTotal: 5000 }, false);
  invalidCoupon.status === 400 ? pass('CPN-001', 'Invalid coupon code returns 400') : fail('CPN-001', 'Invalid coupon code returns 400', `Got ${invalidCoupon.status}`);

  const emptyCoupon = await req('/api/coupons/apply', 'POST', { code: '', cartTotal: 5000 }, false);
  emptyCoupon.status !== 200 ? pass('CPN-002', 'Empty coupon code rejected') : fail('CPN-002', 'Empty coupon code rejected', `Got ${emptyCoupon.status}`);

  const belowMinCoupon = await req('/api/coupons/apply', 'POST', { code: 'TEST10', cartTotal: 100 }, false);
  // May or may not exist — just testing graceful handling
  console.log(`[CPN-003] Coupon with below-min cart: Status=${belowMinCoupon.status}`);

  // ─── PRODUCT TESTS ────────────────────────────────────────────────────────────
  const products = await req('/api/products', 'GET', null, true);
  products.status === 200 && Array.isArray(products.body) ? pass('PRD-001', 'Products list returns array') : fail('PRD-001', 'Products list returns array', `Got ${products.status}: ${typeof products.body}`);

  if (products.body?.length > 0) {
    const p1 = products.body[0];
    console.log(`[PRD-002] First product: id=${p1.id}, name="${p1.name}", price=${p1.price}, stock=${p1.stock}, mrp_price=${p1.mrp_price}`);
    !p1.mrp_price ? warn('PRD-002', 'MRP price is null for products', 'mrp_price=null means no discount display — check if this is intentional') : pass('PRD-002', 'Product has MRP price');
    !p1.description ? warn('PRD-003', 'Product description is null', 'description=null for product — could cause empty PDP description sections') : pass('PRD-003', 'Product has description');
  }

  // ─── CATEGORY TESTS ───────────────────────────────────────────────────────────
  const cats = await req('/api/categories', 'GET', null, true);
  cats.status === 200 ? pass('CAT-001', 'Categories load successfully') : fail('CAT-001', 'Categories load', `Got ${cats.status}`);

  // ─── STATS / ADMIN ENDPOINT PROTECTION ───────────────────────────────────────
  const statsNoAuth = await req('/api/stats', 'GET', null, true);
  (statsNoAuth.status === 401 || statsNoAuth.status === 403)
    ? pass('SEC-004', 'Stats endpoint requires authentication')
    : warn('SEC-004', 'Stats endpoint may be public', `Got ${statsNoAuth.status} without auth`);

  // ─── FORM VALIDATION ─────────────────────────────────────────────────────────
  const emptyLogin = await req('/api/auth/login', 'POST', { email: '', password: '' }, true);
  emptyLogin.status !== 200 ? pass('VAL-001', 'Empty login fields rejected') : fail('VAL-001', 'Empty login fields rejected', `Got 200 with empty email/password`);

  const negativeQtyCart = await req('/api/cart', 'POST', { product_id: 1, quantity: -5, size: 'Free Size (M to XL)' }, false);
  console.log(`[VAL-002] Negative quantity in cart: Status=${negativeQtyCart.status}, qty=${negativeQtyCart.body?.cartItem?.quantity}`);
  if (negativeQtyCart.status === 400 || negativeQtyCart.body?.cartItem?.quantity >= 1) {
    pass('VAL-002', 'Negative cart quantity handled safely');
  } else {
    fail('VAL-002', 'Negative cart quantity not validated', `Got qty=${negativeQtyCart.body?.cartItem?.quantity}`);
  }

  // ─── DATABASE STOCK CHECK ─────────────────────────────────────────────────────
  console.log('\n=== DATABASE CHECKS ===');
  const products_db = await prisma.product.findMany({ include: { variants: true }, take: 5 });
  products_db.forEach(p => {
    const variants_with_stock = p.variants.filter(v => v.stock > 0);
    console.log(`  Product "${p.name}": stock=${p.stock}, variants=${p.variants.length}, active_with_stock=${variants_with_stock.length}`);
    if (p.stock !== p.variants.reduce((s, v) => s + v.stock, 0)) {
      fail(`DB-${p.id}`, `Product stock mismatch`, `product.stock=${p.stock} but sum(variant.stock)=${p.variants.reduce((s, v) => s + v.stock, 0)}`);
    }
  });

  // Check for negative stock
  const negativeStock = await prisma.productVariant.findMany({ where: { stock: { lt: 0 } } });
  negativeStock.length === 0 ? pass('DB-001', 'No negative stock variants in DB') : fail('DB-001', 'Negative stock found', `${negativeStock.length} variants with negative stock: ${negativeStock.map(v => v.id).join(',')}`);

  // Check coupon expiry field
  const coupons = await prisma.coupon.findMany({ take: 5 });
  console.log(`\n  Coupons in DB: ${coupons.length}`);
  coupons.forEach(c => console.log(`    Code: ${c.code}, active=${c.is_active}, expires=${c.expires_at}, usage_limit=${c.usage_limit}, used_count=${c.used_count}`));
  
  // CRITICAL: Check if coupon controller validates expiry and usage limits
  const couponSchema = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Coupon' ORDER BY column_name`;
  console.log('  Coupon table columns:', couponSchema.map(c => c.column_name).join(', '));
  
  const hasExpiry = couponSchema.some(c => c.column_name === 'expires_at');
  const hasUsageLimit = couponSchema.some(c => c.column_name === 'usage_limit');
  !hasExpiry ? warn('DB-002', 'Coupon expires_at column check', 'Column may not exist or check logic') : pass('DB-002', 'Coupon has expires_at column');

  // ─── SUMMARY ─────────────────────────────────────────────────────────────────
  console.log('\n===== TEST SUMMARY =====');
  const passed = results.filter(r => r.pass === true).length;
  const failed = results.filter(r => r.pass === false).length;
  const warns = results.filter(r => r.pass === null).length;
  console.log(`✅ PASS: ${passed}`);
  console.log(`❌ FAIL: ${failed}`);
  console.log(`⚠️  WARN: ${warns}`);
  console.log('\nFailed Tests:');
  results.filter(r => r.pass === false).forEach(r => console.log(`  - [${r.id}] ${r.title}: ${r.detail}`));
  console.log('\nWarnings:');
  results.filter(r => r.pass === null).forEach(r => console.log(`  - [${r.id}] ${r.title}: ${r.detail}`));

  await prisma.$disconnect();
}

runTests().catch(console.error);
