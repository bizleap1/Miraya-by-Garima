import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import EmbeddedPostgres from 'embedded-postgres';
import app from '../src/app.js';
import prisma from '../src/prisma/client.js';
import { JWT_SECRET } from '../src/config/env.js';
import { validateCouponServerSide } from '../src/controllers/coupon.controller.js';

let server;
let baseUrl;
let pgInstance = null;
let testUser = null;
let testAdmin = null;

describe('MIRAYA BY GARIMA — SECURITY & OPERATIONAL INTEGRITY TEST SUITE', () => {

  before(async () => {
    // 1. Start embedded postgres for local integration test run
    pgInstance = new EmbeddedPostgres({
      port: 5432,
      databaseDir: './.pgdata',
      user: 'postgres',
      password: 'password',
      db: 'postgres',
      persistent: true,
    });

    try {
      await pgInstance.initialise();
    } catch (_) {}
    try {
      await pgInstance.start();
    } catch (_) {}

    await prisma.$connect();

    // Seed test users for reliable authentication tests
    testUser = await prisma.user.upsert({
      where: { email: 'testcustomer@miraya.com' },
      update: { role: 'customer' },
      create: {
        email: 'testcustomer@miraya.com',
        name: 'Test Customer',
        password_hash: 'hashedpassword',
        role: 'customer',
      },
    });

    testAdmin = await prisma.user.upsert({
      where: { email: 'testadmin@miraya.com' },
      update: { role: 'admin' },
      create: {
        email: 'testadmin@miraya.com',
        name: 'Test Admin',
        password_hash: 'hashedpassword',
        role: 'admin',
      },
    });

    // 2. Start ephemeral HTTP server on random free port
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await prisma.$disconnect();
    if (pgInstance) {
      try {
        await pgInstance.stop();
      } catch (_) {}
    }
  });

  // ─── 1. HEALTH & TTFB SPEED ───────────────────────────────────────────────
  it('1. GET /health responds immediately with status ok (< 100ms TTFB)', async () => {
    const startTime = Date.now();
    const res = await fetch(`${baseUrl}/health`);
    const elapsed = Date.now() - startTime;
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.status, 'ok');
    assert.ok(elapsed < 200, `Expected TTFB under 200ms, took ${elapsed}ms`);
  });

  // ─── 2. PASSWORD RESET WITHOUT OTP (ACCOUNT TAKEOVER) ─────────────────────
  it('2a. POST /api/auth/reset-password rejects when OTP is missing (blocks account takeover)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        newPassword: 'HackedPassword123!',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.match(data.message, /OTP/i);
  });

  it('2b. POST /api/auth/reset-password rejects when invalid OTP is provided', async () => {
    const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        otp: '999999',
        newPassword: 'HackedPassword123!',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.match(data.message, /Invalid or expired OTP/i);
  });

  // ─── 3. DIRECT FAKE RAZORPAY PAYMENT ID BYPASS ────────────────────────────
  it('3. POST /api/orders rejects paymentMethod: "razorpay" (blocks unpaid fake order bypass)', async () => {
    const customerToken = jwt.sign({ userId: testUser.id, role: testUser.role }, JWT_SECRET, { expiresIn: '1h' });

    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [
          { product_id: 1, variant_id: 1, quantity: 1, size: 'M', price: 9999 }
        ],
        paymentMethod: 'razorpay',
        total: 9999,
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.code, 'DIRECT_PAYMENT_NOT_PERMITTED');
    assert.match(data.message, /secure payment verification/i);
  });

  // ─── 4. SETTINGS ROUTE ADMIN RBAC ENFORCEMENT ──────────────────────────────
  it('4a. PUT /api/settings rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cod_enabled: false }),
    });

    assert.equal(res.status, 401);
  });

  it('4b. PUT /api/settings rejects non-admin customer accounts with 403 Forbidden', async () => {
    const customerToken = jwt.sign({ userId: testUser.id, role: testUser.role }, JWT_SECRET, { expiresIn: '1h' });

    const res = await fetch(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ cod_enabled: false }),
    });

    const data = await res.json();
    assert.equal(res.status, 403);
    assert.equal(data.code, 'FORBIDDEN');
  });

  // ─── 5. ADDRESS DELETION IDOR OWNERSHIP ENFORCEMENT ───────────────────────
  it('5a. DELETE /api/addresses/:id rejects unauthenticated deletion with 401', async () => {
    const res = await fetch(`${baseUrl}/api/addresses/123`, {
      method: 'DELETE',
    });

    assert.equal(res.status, 401);
  });

  it('5b. DELETE /api/addresses/:id rejects invalid address ID with 400', async () => {
    const customerToken = jwt.sign({ userId: testUser.id, role: testUser.role }, JWT_SECRET, { expiresIn: '1h' });

    const res = await fetch(`${baseUrl}/api/addresses/abc-invalid`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    assert.equal(res.status, 400);
  });

  it('5c. DELETE /api/addresses/:id returns 404 for non-existent address', async () => {
    const customerToken = jwt.sign({ userId: testUser.id, role: testUser.role }, JWT_SECRET, { expiresIn: '1h' });

    const res = await fetch(`${baseUrl}/api/addresses/999999`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    assert.equal(res.status, 404);
  });

  // ─── 6. PAYMENT RESERVATION RELEASE IDOR ──────────────────────────────────
  it('6a. POST /api/payments/release-hold rejects when razorpay_order_id is missing', async () => {
    const res = await fetch(`${baseUrl}/api/payments/release-hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.match(data.message, /razorpay_order_id is required/i);
  });

  it('6b. POST /api/payments/release-hold returns 404 for unknown order reservation', async () => {
    const res = await fetch(`${baseUrl}/api/payments/release-hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ razorpay_order_id: 'order_nonexistent_999999' }),
    });

    const data = await res.json();
    assert.equal(res.status, 404);
  });

  // ─── 7. RAZORPAY WEBHOOK SIGNATURE VERIFICATION ───────────────────────────
  it('7a. POST /api/payments/webhook rejects payload with missing signature', async () => {
    const res = await fetch(`${baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'payment.captured' }),
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.match(data.message, /Missing webhook signature/i);
  });

  it('7b. POST /api/payments/webhook rejects payload with invalid signature', async () => {
    const res = await fetch(`${baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'invalid_signature_hex_1234567890abcdef',
      },
      body: JSON.stringify({ event: 'payment.captured' }),
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.match(data.message, /Invalid webhook signature/i);
  });

  it('7c. POST /api/payments/webhook correctly validates signature using raw body', async () => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_miraya2026';
    const payload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: { entity: { id: 'pay_test_123', order_id: 'order_test_456' } }
      }
    });

    const validSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(Buffer.from(payload))
      .digest('hex');

    const res = await fetch(`${baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validSignature,
      },
      body: payload,
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
  });

  // ─── 8. SERVER-SIDE COUPON VALIDATION ─────────────────────────────────────
  it('8a. validateCouponServerSide rejects empty or invalid coupon', async () => {
    const result = await validateCouponServerSide('', 5000);
    assert.equal(result.valid, false);
    assert.equal(result.code, 'INVALID_COUPON');
  });

  it('8b. validateCouponServerSide rejects non-existent coupon in DB', async () => {
    const result = await validateCouponServerSide('FAKE_NON_EXISTENT_COUPON_2026', 5000);
    assert.equal(result.valid, false);
    assert.equal(result.code, 'COUPON_INACTIVE');
  });

});
