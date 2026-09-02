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

async function runFinalLogicVerification() {
  console.log('\n==================================================');
  console.log('   MIRAYA — FINAL LOGIC VERIFICATION SUITE       ');
  console.log('==================================================\n');

  let passed = true;

  let userA = await prisma.user.findFirst({ where: { email: 'rt_user_a@miraya.com' } });
  let adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });

  const tokenA = jwt.sign({ userId: userA.id, role: 'customer' }, JWT_SECRET);
  const tokenAdmin = jwt.sign({ userId: adminUser.id, role: 'admin' }, JWT_SECRET);

  await prisma.productVariant.updateMany({ data: { is_active: true } });

  let product = await prisma.product.findFirst({ include: { variants: true } });
  let variant = product.variants.find(v => v.is_active) || product.variants[0];

  // Restock variant to 25 units cleanly
  await req('/api/inventory/adjust', 'POST', {
    variant_id: variant.id,
    product_id: product.id,
    quantity_delta: 25,
    type: 'RESTOCK',
    note: 'Final logic verification restock'
  }, tokenAdmin);



  // ---------------------------------------------------------------------------
  // 1. ORDER TERMINAL STATUS TRANSITION VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('--- 1. Order Terminal Status Transition Tests ---');

  // Place fresh order
  const oRes = await req('/api/orders', 'POST', {
    items: [{ product_id: product.id, variant_id: variant.id, quantity: 1, size: variant.size }],
    paymentMethod: 'cod',
    shippingDetails: { fullName: 'Terminal Test User', phone: '9876543210', addressLine1: 'Terminal St', city: 'Nagpur', state: 'MH', pincode: '440033' }
  }, tokenA);

  const testOrder = oRes.body?.order;

  // Move PROCESSING -> SHIPPED -> DELIVERED
  await req(`/api/orders/${testOrder.id}/status`, 'PUT', { status: 'shipped' }, tokenAdmin);
  const delRes = await req(`/api/orders/${testOrder.id}/status`, 'PUT', { status: 'delivered' }, tokenAdmin);

  if (delRes.status === 200 && delRes.body.order.status === 'delivered') {
    console.log(`✅ Allowed transition: PROCESSING -> SHIPPED -> DELIVERED (Order #${testOrder.id})`);
  } else {
    console.log('❌ FAIL: Normal delivery transition failed!');
    passed = false;
  }

  // Attempt invalid transitions on DELIVERED order
  const invCancel = await req(`/api/orders/${testOrder.id}/status`, 'PUT', { status: 'cancelled' }, tokenAdmin);
  const invProc = await req(`/api/orders/${testOrder.id}/status`, 'PUT', { status: 'processing' }, tokenAdmin);
  const invShip = await req(`/api/orders/${testOrder.id}/status`, 'PUT', { status: 'shipped' }, tokenAdmin);

  if (invCancel.status === 400 && invProc.status === 400 && invShip.status === 400) {
    console.log('✅ PASS: Rejected DELIVERED -> CANCELLED/PROCESSING/SHIPPED with 400 INVALID_TRANSITION');
  } else {
    console.log(`❌ FAIL: Invalid terminal transition allowed! Cancel: ${invCancel.status}, Proc: ${invProc.status}, Ship: ${invShip.status}`);
    passed = false;
  }

  // ---------------------------------------------------------------------------
  // 2. PRODUCT ARCHIVE VS INVENTORY RESERVATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Product Soft-Archive vs Inventory Reservation Tests ---');

  const delProdRes = await req(`/api/products/${product.id}`, 'DELETE', null, tokenAdmin);
  const reFetchedProd = await prisma.product.findUnique({ where: { id: product.id }, include: { variants: true } });
  const reFetchedVar = reFetchedProd.variants.find(v => v.id === variant.id);

  if (delProdRes.status === 200 && delProdRes.body.archived && !reFetchedProd.is_active) {
    const avail = reFetchedVar.stock - reFetchedVar.reserved_stock;
    console.log(`✅ PASS: Product soft-archived (is_active = false). Physical stock preserved (${reFetchedVar.stock}), Reserved stock (${reFetchedVar.reserved_stock}), Available (${avail})`);
  } else {
    console.log('❌ FAIL: Product soft-archive failed!', delProdRes.body);
    passed = false;
  }

  // Re-activate product variants for remaining tests
  await prisma.productVariant.updateMany({ where: { product_id: product.id }, data: { is_active: true } });


  // ---------------------------------------------------------------------------
  // 3. EXCHANGE INVENTORY LIFECYCLE & BOUNDS
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Exchange Inventory Lifecycle & Bounds Tests ---');

  // Create delivered order for exchange
  const exOrderRes = await req('/api/orders', 'POST', {
    items: [{ product_id: product.id, variant_id: variant.id, quantity: 1, size: variant.size }],
    paymentMethod: 'cod',
    shippingDetails: { fullName: 'Exchange User', phone: '9876543210', addressLine1: 'Exchange St', city: 'Nagpur', state: 'MH', pincode: '440033' }
  }, tokenA);

  const exOrder = exOrderRes.body?.order;
  await req(`/api/orders/${exOrder.id}/status`, 'PUT', { status: 'delivered' }, tokenAdmin);

  // Submit size exchange request
  const exReqRes = await req('/api/returns', 'POST', {
    order_id: exOrder.id,
    product_id: product.id,
    variant_id: variant.id,
    exchange_variant_id: variant.id,
    reason: 'Size too tight',
    quantity: 1,
    exchange_quantity: 1
  }, tokenA);

  const exReq = exReqRes.body?.returnRequest;
  const varBeforeApprove = await prisma.productVariant.findUnique({ where: { id: variant.id } });

  // Admin approves exchange
  await req(`/api/returns/${exReq.id}/status`, 'PUT', { status: 'APPROVED' }, tokenAdmin);
  const varAfterApprove = await prisma.productVariant.findUnique({ where: { id: variant.id } });

  if (varAfterApprove.reserved_stock === varBeforeApprove.reserved_stock + 1) {
    console.log(`✅ PASS: Exchange APPROVED -> reserved_stock increased by 1 (${varBeforeApprove.reserved_stock} -> ${varAfterApprove.reserved_stock})`);
  } else {
    console.log('❌ FAIL: Exchange APPROVED reservation increment failed!');
    passed = false;
  }

  // Admin rejects exchange -> releases reservation
  await req(`/api/returns/${exReq.id}/status`, 'PUT', { status: 'REJECTED' }, tokenAdmin);
  const varAfterReject = await prisma.productVariant.findUnique({ where: { id: variant.id } });

  if (varAfterReject.reserved_stock === varBeforeApprove.reserved_stock) {
    console.log(`✅ PASS: Exchange REJECTED -> reserved_stock released back (${varAfterApprove.reserved_stock} -> ${varAfterReject.reserved_stock})`);
  } else {
    console.log('❌ FAIL: Exchange REJECTED reservation release failed!');
    passed = false;
  }

  // Verify non-negative bounds
  if (varAfterReject.stock >= 0 && varAfterReject.reserved_stock >= 0 && varAfterReject.reserved_stock <= varAfterReject.stock) {
    console.log(`✅ PASS: Inventory Bounds Intact (Stock: ${varAfterReject.stock}, Reserved: ${varAfterReject.reserved_stock}, Available: ${varAfterReject.stock - varAfterReject.reserved_stock})`);
  } else {
    console.log('❌ FAIL: Inventory bounds violated!');
    passed = false;
  }

  // ---------------------------------------------------------------------------
  // 4. PRODUCT DELETE REGRESSION (DRAFT UNREFERENCED PRODUCT)
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Product Hard Delete Draft Safety Test ---');

  const draftRes = await req('/api/products', 'POST', {
    name: 'Unreferenced Draft Outfit',
    description: 'Draft',
    price: 1999,
    category_id: product.category_id,
    stock: 5,
    sizes: ['M']
  }, tokenAdmin);

  const draftProd = draftRes.body?.product;


  const delDraftRes = await req(`/api/products/${draftProd.id}`, 'DELETE', null, tokenAdmin);
  const checkDraft = await prisma.product.findUnique({ where: { id: draftProd.id } });

  if (delDraftRes.status === 200 && !delDraftRes.body.archived && !checkDraft) {
    console.log(`✅ PASS: Unreferenced draft product #${draftProd.id} hard deleted safely without leaving orphaned records.`);
  } else {
    console.log('❌ FAIL: Draft product deletion failed!');
    passed = false;
  }

  console.log('\n==================================================');
  console.log(passed ? '  ALL LOGIC VERIFICATION TESTS PASSED SUCCESSFULLY!' : '  LOGIC VERIFICATION FAILED!');
  console.log('==================================================\n');

  await prisma.$disconnect();
}

runFinalLogicVerification().catch(console.error);
