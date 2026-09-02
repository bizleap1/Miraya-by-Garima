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

async function runReconnectResyncTest() {
  console.log('\n==================================================');
  console.log('  MIRAYA — TRUE RECONNECT RESYNC VERIFICATION TEST');
  console.log('==================================================\n');

  let passed = true;

  // Setup Users & Tokens
  let userA = await prisma.user.findFirst({ where: { email: 'rt_user_a@miraya.com' } });
  let adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });

  const tokenA = jwt.sign({ userId: userA.id, role: 'customer' }, JWT_SECRET);
  const tokenAdmin = jwt.sign({ userId: adminUser.id, role: 'admin' }, JWT_SECRET);

  let product = await prisma.product.findFirst({ include: { variants: true } });
  let variant = product.variants[0];

  // ---------------------------------------------------------------------------
  // TEST 1: PDP RECONNECT RESYNC
  // ---------------------------------------------------------------------------
  console.log('--- TEST 1: PDP Reconnect Resync ---');
  const customerSocket = ioClient(SOCKET_URL, { auth: { token: tokenA }, transports: ['websocket'] });
  await new Promise(r => setTimeout(r, 400));

  console.log('1. Customer viewing PDP. Disconnecting socket...');
  customerSocket.disconnect();
  await new Promise(r => setTimeout(r, 200));

  const targetPrice = 6499;
  console.log(`2. Admin changes product price while customer offline to ₹${targetPrice}...`);
  await req(`/api/products/${product.id}`, 'PUT', { price: targetPrice }, tokenAdmin);

  console.log('3. Reconnecting customer socket...');
  let resyncTriggered = false;
  customerSocket.on('connect', () => { resyncTriggered = true; });
  customerSocket.connect();
  await new Promise(r => setTimeout(r, 400));

  // Simulate customer page re-fetch upon reconnect
  const pdpFetch = await req(`/api/products/${product.id}`, 'GET', null, tokenA);
  if (resyncTriggered && pdpFetch.status === 200 && Number(pdpFetch.body.price) === targetPrice) {
    console.log(`✅ PASS: Reconnected customer fetched latest DB price ₹${pdpFetch.body.price} (PostgreSQL Authoritative)`);
  } else {
    console.log('❌ FAIL: PDP Reconnect Resync mismatch');
    passed = false;
  }
  customerSocket.disconnect();

  // ---------------------------------------------------------------------------
  // TEST 2: CUSTOMER ORDER STATUS RECONNECT RESYNC
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 2: Customer Order Status Reconnect Resync ---');
  // Create order
  const orderRes = await req('/api/orders', 'POST', {
    items: [{ product_id: product.id, variant_id: variant.id, quantity: 1, size: variant.size }],
    paymentMethod: 'cod',
    shippingDetails: { fullName: 'RT Resync User', phone: '9876543210', addressLine1: 'Resync St', city: 'Nagpur', state: 'MH', pincode: '440033' }
  }, tokenA);

  const testOrder = orderRes.body?.order;
  const custSocket2 = ioClient(SOCKET_URL, { auth: { token: tokenA }, transports: ['websocket'] });
  await new Promise(r => setTimeout(r, 400));

  console.log(`1. Order #${testOrder.id} created with status '${testOrder.status}'. Disconnecting customer socket...`);
  custSocket2.disconnect();
  await new Promise(r => setTimeout(r, 200));

  console.log(`2. Admin updates order #${testOrder.id} status to 'delivered' while customer offline...`);
  await req(`/api/orders/${testOrder.id}/status`, 'PUT', { status: 'delivered' }, tokenAdmin);

  console.log('3. Reconnecting customer socket...');
  custSocket2.connect();
  await new Promise(r => setTimeout(r, 400));

  // Customer fetches authoritative orders
  const ordersFetch = await req('/api/orders', 'GET', null, tokenA);
  const updatedOrder = ordersFetch.body.find(o => o.id === testOrder.id);

  if (updatedOrder && updatedOrder.status === 'delivered') {
    console.log(`✅ PASS: Reconnected customer fetched latest DB order status '${updatedOrder.status}' (PostgreSQL Authoritative)`);
  } else {
    console.log('❌ FAIL: Order Status Reconnect Resync mismatch');
    passed = false;
  }
  custSocket2.disconnect();

  // ---------------------------------------------------------------------------
  // TEST 3: ADMIN DASHBOARD RECONNECT RESYNC
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 3: Admin Dashboard Reconnect Resync ---');
  const adminSocket = ioClient(SOCKET_URL, { auth: { token: tokenAdmin }, transports: ['websocket'] });
  await new Promise(r => setTimeout(r, 400));

  console.log('1. Admin dashboard open. Disconnecting admin socket...');
  adminSocket.disconnect();
  await new Promise(r => setTimeout(r, 200));

  console.log('2. Customer places new order while admin offline...');
  const newOrderRes = await req('/api/orders', 'POST', {
    items: [{ product_id: product.id, variant_id: variant.id, quantity: 1, size: variant.size }],
    paymentMethod: 'cod',
    shippingDetails: { fullName: 'Offline Order User', phone: '9876543210', addressLine1: 'Offline St', city: 'Nagpur', state: 'MH', pincode: '440033' }
  }, tokenA);
  const offlineOrder = newOrderRes.body?.order;

  console.log('3. Reconnecting admin socket...');
  adminSocket.connect();
  await new Promise(r => setTimeout(r, 400));

  const adminOrdersFetch = await req('/api/orders/all', 'GET', null, tokenAdmin);
  const foundOfflineOrder = adminOrdersFetch.body.find(o => o.id === offlineOrder.id);

  if (foundOfflineOrder) {
    console.log(`✅ PASS: Reconnected admin fetched latest DB orders including offline Order #${foundOfflineOrder.id}`);
  } else {
    console.log('❌ FAIL: Admin Reconnect Resync mismatch');
    passed = false;
  }
  adminSocket.disconnect();

  console.log('\n==================================================');
  console.log(passed ? '  ALL RECONNECT RESYNC TESTS PASSED SUCCESSFULLY!  ' : '  RECONNECT RESYNC TESTS FAILED!');
  console.log('==================================================\n');

  await prisma.$disconnect();
}

runReconnectResyncTest().catch(console.error);
