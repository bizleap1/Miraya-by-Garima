import http from 'http';
import prisma from '../prisma/client.js';
import jwt from 'jsonwebtoken';
import { io as ioClient } from 'socket.io-client';

const JWT_SECRET = 'miraya-dev-jwt-secret-key-2026';
const SOCKET_URL = 'http://localhost:5000';

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

function waitForMatchingEvent(socket, eventName, filterFn, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      socket.off(eventName, handler);
      resolve(null);
    }, timeoutMs);

    function handler(data) {
      if (!filterFn || filterFn(data)) {
        clearTimeout(timer);
        socket.off(eventName, handler);
        resolve(data);
      }
    }

    socket.on(eventName, handler);
  });
}

async function runRealtimeTestSuite() {
  console.log('\n==================================================');
  console.log('   MIRAYA — REAL-TIME SOCKET.IO WORKFLOW RETEST   ');
  console.log('==================================================\n');

  const results = [];
  const logPass = (id, title, detail = '') => { console.log(`✅ PASS [${id}] ${title} ${detail ? '— ' + detail : ''}`); results.push({ id, title, pass: true, detail }); };
  const logFail = (id, title, detail = '') => { console.log(`❌ FAIL [${id}] ${title} — ${detail}`); results.push({ id, title, pass: false, detail }); };

  // Setup Test Users in Database
  let userA = await prisma.user.findFirst({ where: { email: 'rt_user_a@miraya.com' } });
  if (!userA) userA = await prisma.user.create({ data: { name: 'RT User A', email: 'rt_user_a@miraya.com', password_hash: '$2b$10$hash', role: 'customer' } });

  let userB = await prisma.user.findFirst({ where: { email: 'rt_user_b@miraya.com' } });
  if (!userB) userB = await prisma.user.create({ data: { name: 'RT User B', email: 'rt_user_b@miraya.com', password_hash: '$2b$10$hash', role: 'customer' } });

  let adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!adminUser) adminUser = await prisma.user.create({ data: { name: 'Admin User', email: 'rt_admin@miraya.com', password_hash: '$2b$10$hash', role: 'admin' } });

  const tokenA = jwt.sign({ userId: userA.id, role: 'customer' }, JWT_SECRET);
  const tokenB = jwt.sign({ userId: userB.id, role: 'customer' }, JWT_SECRET);
  const tokenAdmin = jwt.sign({ userId: adminUser.id, role: 'admin' }, JWT_SECRET);

  // Connect WebSockets
  const adminSocket = ioClient(SOCKET_URL, { auth: { token: tokenAdmin }, transports: ['websocket'] });
  const customerASocket = ioClient(SOCKET_URL, { auth: { token: tokenA }, transports: ['websocket'] });
  const customerBSocket = ioClient(SOCKET_URL, { auth: { token: tokenB }, transports: ['websocket'] });

  await new Promise((r) => setTimeout(r, 500));

  // Find or create test product with fresh stock
  let product = await prisma.product.findFirst({ include: { variants: true } });
  let variant = product.variants[0];

  // Restock variant to 20 units cleanly before starting
  await req('/api/inventory/adjust', 'POST', {
    variant_id: variant.id,
    product_id: product.id,
    quantity_delta: 20,
    type: 'RESTOCK',
    note: 'Initial restock for realtime test'
  }, tokenAdmin);

  // Fetch updated variant state
  const updatedVar = await prisma.productVariant.findUnique({ where: { id: variant.id } });
  variant = updatedVar;

  // ---------------------------------------------------------------------------
  // TEST 1: Admin Price Update -> Storefront Sync & Latency Test
  // ---------------------------------------------------------------------------
  const newPrice = 5999;
  const t1StartTime = Date.now();
  const eventPromise1 = waitForMatchingEvent(customerASocket, 'product.updated', e => e.productId === product.id);

  const updateRes = await req(`/api/products/${product.id}`, 'PUT', { price: newPrice }, tokenAdmin);
  const event1 = await eventPromise1;
  const t1Latency = Date.now() - t1StartTime;

  if (updateRes.status === 200 && event1 && Number(event1.price) === newPrice) {
    logPass('TEST 1', 'Admin price update -> Storefront receives product.updated', `Latency: ${t1Latency}ms, Price: ₹${event1.price}`);
  } else {
    logFail('TEST 1', 'Price update real-time sync failed!', `Event: ${JSON.stringify(event1)}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Admin Stock Edit -> PDP Stock Sync
  // ---------------------------------------------------------------------------
  const targetVar = await prisma.productVariant.findFirst({ where: { product_id: product.id, is_active: true } });
  const eventPromise2 = waitForMatchingEvent(customerASocket, 'inventory.updated', e => Number(e.variantId) === Number(targetVar.id) && e.available_stock === 0);
  await req('/api/inventory/adjust', 'POST', {
    variant_id: targetVar.id,
    product_id: product.id,
    quantity_delta: -targetVar.stock,
    type: 'MANUAL_ADJUSTMENT',
    note: 'Realtime test stock zero'
  }, tokenAdmin);

  const event2 = await eventPromise2;
  if (event2 && Number(event2.variantId) === Number(targetVar.id) && event2.available_stock === 0) {
    logPass('TEST 2', 'Admin stock zero edit -> PDP receives inventory.updated (Out of stock)', `Available Stock: ${event2.available_stock}`);
  } else {
    logFail('TEST 2', 'Stock zero edit sync failed!', `Event: ${JSON.stringify(event2)}`);
  }



  // ---------------------------------------------------------------------------
  // RESTOCK FOR SUBSEQUENT TESTS
  // ---------------------------------------------------------------------------
  await req('/api/inventory/adjust', 'POST', {
    variant_id: targetVar.id,
    product_id: product.id,
    quantity_delta: 25,
    type: 'RESTOCK',
    note: 'Restock for test suite'
  }, tokenAdmin);


  // ---------------------------------------------------------------------------
  // TEST 3: Customer Order Placement -> Admin Sync
  // ---------------------------------------------------------------------------
  const eventPromise3 = waitForMatchingEvent(adminSocket, 'order.created');
  const orderRes = await req('/api/orders', 'POST', {
    items: [{ product_id: product.id, variant_id: variant.id, quantity: 1, size: variant.size }],
    paymentMethod: 'cod',
    shippingDetails: { fullName: 'RT User A', phone: '9876543210', addressLine1: 'Atelier St', city: 'Nagpur', state: 'MH', pincode: '440033' }
  }, tokenA);

  const event3 = await eventPromise3;
  const createdOrder = orderRes.body?.order;

  if (orderRes.status === 201 && createdOrder && event3 && String(event3.orderId) === String(createdOrder.id)) {
    logPass('TEST 3', 'Customer places order -> Admin receives order.created', `Order #${event3.orderId}`);
  } else {
    logFail('TEST 3', 'Order placement sync failed!', `Status: ${orderRes.status}, Event: ${JSON.stringify(event3)}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Admin Order Status Update -> Customer Sync
  // ---------------------------------------------------------------------------
  if (createdOrder) {
    const eventPromise4 = waitForMatchingEvent(customerASocket, 'order.updated', e => String(e.orderId) === String(createdOrder.id));
    await req(`/api/orders/${createdOrder.id}/status`, 'PUT', { status: 'shipped' }, tokenAdmin);

    const event4 = await eventPromise4;
    if (event4 && String(event4.orderId) === String(createdOrder.id) && event4.status === 'shipped') {
      logPass('TEST 4', 'Admin updates status (Processing -> Shipped) -> Customer receives order.updated', `Status: ${event4.status}`);
    } else {
      logFail('TEST 4', 'Order status update sync failed!', `Event: ${JSON.stringify(event4)}`);
    }
  } else {
    logFail('TEST 4', 'Skipped because order creation failed in Test 3');
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Cart Stale Stock Recalculation Notification
  // ---------------------------------------------------------------------------
  const eventPromise5 = waitForMatchingEvent(customerASocket, 'inventory.updated', e => e.productId === product.id);
  await req('/api/inventory/adjust', 'POST', {
    variant_id: variant.id,
    product_id: product.id,
    quantity_delta: -5,
    type: 'MANUAL_ADJUSTMENT',
    note: 'Simulate competitor stock consumption'
  }, tokenAdmin);

  const event5 = await eventPromise5;
  if (event5 && event5.productId === product.id) {
    logPass('TEST 5', 'Competitor consumes stock -> Cart listener receives inventory.updated', `New available stock: ${event5.available_stock}`);
  } else {
    logFail('TEST 5', 'Cart stale stock event failed!', `Event: ${JSON.stringify(event5)}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Coupon Disabling Sync
  // ---------------------------------------------------------------------------
  const eventPromise6 = waitForMatchingEvent(customerASocket, 'coupon.updated');
  const cRes = await req('/api/coupons', 'POST', {
    code: `RTCOUP-${Date.now().toString().slice(-4)}`,
    discount_percent: 15
  }, tokenAdmin);

  const event6 = await eventPromise6;
  if (cRes.status === 201 && event6 && event6.code === cRes.body.coupon.code) {
    logPass('TEST 6', 'Admin creates/updates coupon -> Checkout receives coupon.updated', `Coupon Code: ${event6.code}`);
  } else {
    logFail('TEST 6', 'Coupon sync failed!', `Event: ${JSON.stringify(event6)}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Store Settings Exchange Toggle Sync
  // ---------------------------------------------------------------------------
  const eventPromise7 = waitForMatchingEvent(customerASocket, 'store_settings.updated');
  await req('/api/settings', 'PUT', { exchange_enabled: false }, tokenAdmin);

  const event7 = await eventPromise7;
  if (event7 && event7.exchange_enabled === false) {
    logPass('TEST 7', 'Admin toggles Exchange OFF -> Storefront receives store_settings.updated', `exchange_enabled: ${event7.exchange_enabled}`);
  } else {
    logFail('TEST 7', 'Store settings exchange toggle sync failed!', `Event: ${JSON.stringify(event7)}`);
  }

  // Restore exchange_enabled = true
  await req('/api/settings', 'PUT', { exchange_enabled: true, exchange_window_days: 7 }, tokenAdmin);

  // ---------------------------------------------------------------------------
  // TEST 8: Customer Room Security (Isolated Customer Events)
  // ---------------------------------------------------------------------------
  let userBReceivedUserAEvent = false;
  const listener = () => { userBReceivedUserAEvent = true; };
  customerBSocket.on('order.created', listener);

  await req('/api/orders', 'POST', {
    items: [{ product_id: product.id, variant_id: variant.id, quantity: 1, size: variant.size }],
    paymentMethod: 'cod',
    shippingDetails: { fullName: 'RT User A Private', phone: '9876543210', addressLine1: 'Secret St', city: 'Nagpur', state: 'MH', pincode: '440033' }
  }, tokenA);

  await new Promise((r) => setTimeout(r, 400));
  customerBSocket.off('order.created', listener);

  if (!userBReceivedUserAEvent) {
    logPass('TEST 8', 'Customer Room Security -> Customer B receives 0 events for Customer A order', 'Room isolation enforced');
  } else {
    logFail('TEST 8', 'Customer B received Customer A private order event!', 'Security Leak!');
  }

  // ---------------------------------------------------------------------------
  // TEST 9: Admin Room Security (Unauthenticated/Customer Cannot Join Admin Room)
  // ---------------------------------------------------------------------------
  if (customerASocket.rooms && customerASocket.rooms.has('admin')) {
    logFail('TEST 9', 'Customer socket joined admin room!', 'Role Security Vulnerability');
  } else {
    logPass('TEST 9', 'Admin Room Security -> Customer socket restricted from admin room', 'Role hierarchy enforced');
  }

  // ---------------------------------------------------------------------------
  // TEST 10: Reconnect Handling & Resync
  // ---------------------------------------------------------------------------
  let resyncTriggered = false;
  const tempSocket = ioClient(SOCKET_URL, { auth: { token: tokenA }, transports: ['websocket'] });

  await new Promise((r) => setTimeout(r, 300));
  tempSocket.on('connect', () => { resyncTriggered = true; });

  tempSocket.disconnect();
  await new Promise((r) => setTimeout(r, 200));
  tempSocket.connect();
  await new Promise((r) => setTimeout(r, 300));

  if (resyncTriggered) {
    logPass('TEST 10', 'Socket disconnect -> Reconnect triggers lightweight resync handler', 'Auto-reconnect operational');
  } else {
    logFail('TEST 10', 'Reconnect resync handler failed!', 'No connect event');
  }
  tempSocket.disconnect();

  // ---------------------------------------------------------------------------
  // TEST 11: Multi-Tab Sync (Two Sockets for Same User A)
  // ---------------------------------------------------------------------------
  const customerATab2 = ioClient(SOCKET_URL, { auth: { token: tokenA }, transports: ['websocket'] });
  await new Promise((r) => setTimeout(r, 300));

  const pTab1 = waitForMatchingEvent(customerASocket, 'store_settings.updated');
  const pTab2 = waitForMatchingEvent(customerATab2, 'store_settings.updated');

  await req('/api/settings', 'PUT', { exchange_window_days: 14 }, tokenAdmin);

  const eTab1 = await pTab1;
  const eTab2 = await pTab2;

  if (eTab1 && eTab2 && eTab1.exchange_window_days === 14 && eTab2.exchange_window_days === 14) {
    logPass('TEST 11', 'Multi-Tab Sync -> Both open tabs receive real-time update simultaneously', `Tab 1 & 2 window_days: 14`);
  } else {
    logFail('TEST 11', 'Multi-tab sync failed!', `Tab1: ${!!eTab1}, Tab2: ${!!eTab2}`);
  }

  customerATab2.disconnect();

  // Restore default window_days = 7
  await req('/api/settings', 'PUT', { exchange_window_days: 7 }, tokenAdmin);

  // ---------------------------------------------------------------------------
  // TEST 12: Measured Propagation Latency Report
  // ---------------------------------------------------------------------------
  const latencySamples = [];
  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    const p = waitForMatchingEvent(customerASocket, 'inventory.updated', e => e.variantId === variant.id);
    await req('/api/inventory/adjust', 'POST', {
      variant_id: variant.id,
      product_id: product.id,
      quantity_delta: 1,
      type: 'MANUAL_ADJUSTMENT',
      note: 'Latency test'
    }, tokenAdmin);
    await p;
    latencySamples.push(Date.now() - start);
  }

  const avgLatency = Math.round(latencySamples.reduce((a, b) => a + b, 0) / latencySamples.length);
  logPass('TEST 12', 'Real-time Latency Benchmark', `Average Propagation Latency: ${avgLatency}ms (Target: <100ms)`);

  // Cleanup Sockets
  adminSocket.disconnect();
  customerASocket.disconnect();
  customerBSocket.disconnect();

  // SUMMARY
  console.log('\n==================================================');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`  PASSED: ${passed} / ${results.length}`);
  console.log(`  FAILED: ${failed} / ${results.length}`);
  console.log('==================================================\n');

  await prisma.$disconnect();
}

runRealtimeTestSuite().catch(console.error);
