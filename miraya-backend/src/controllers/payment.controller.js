/**
 * =========================================================================
 * MIRAYA BY GARIMA — PAYMENT CONTROLLER WITH INVENTORY RESERVATION
 * Flow:
 * 1. createRazorpayOrder -> Server computes total -> Atomically reserves inventory (TTL 15m) -> Creates Razorpay order
 * 2. verifyRazorpayPayment -> Cryptographically verifies HMAC -> Idempotently confirms reservation into Order
 * 3. releasePaymentHold -> Releases held stock if user cancels before payment
 * 4. razorpayWebhook -> Server-to-server confirmation / fallback recovery
 * =========================================================================
 */

import crypto from 'crypto';
import razorpay from '../config/razorpay.js';
import prisma from '../prisma/client.js';
import { RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } from '../config/env.js';
import {
  reserveInventoryAtomic,
  confirmReservationAtomic,
  releaseReservationAtomic
} from '../services/inventory.service.js';

/**
 * 1. Create Razorpay order & Atomically Reserve Stock for 15 minutes
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        code: 'PAYMENT_NOT_CONFIGURED',
        message: 'Payment gateway is not configured.',
      });
    }

    const userId = req.user.id;
    const { items: directItems, shippingDetails } = req.body;

    let itemsToProcess = [];

    if (Array.isArray(directItems) && directItems.length > 0) {
      itemsToProcess = directItems;
    } else {
      // Pull items from user's persistent cart
      const cartItems = await prisma.cartItem.findMany({
        where: { user_id: userId },
        include: { product: true, variant: true },
      });

      if (cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          code: 'EMPTY_CART',
          message: 'Cart is empty. Add items before initiating payment.',
        });
      }

      itemsToProcess = cartItems.map(ci => ({
        product_id: ci.product_id,
        variant_id: ci.variant_id,
        size: ci.size,
        quantity: ci.quantity,
      }));
    }

    // Execute atomic reservation & order creation in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate unique temp receipt
      const receiptId = `rcpt_${userId}_${Date.now().toString().slice(-6)}`;

      // Step A: Calculate provisional amount & pre-validate
      let provisionalAmount = 0;
      for (const it of itemsToProcess) {
        const p = await tx.product.findUnique({
          where: { id: parseInt(it.product_id || it.productId, 10) },
        });
        if (!p) throw new Error('Product not found');
        provisionalAmount += Number(p.price) * (it.quantity || 1);
      }

      // Step B: Create Razorpay Order
      const rzpOptions = {
        amount: Math.round(provisionalAmount * 100), // in paise
        currency: 'INR',
        receipt: receiptId,
        notes: {
          user_id: String(userId),
          user_email: req.user.email,
        },
      };

      const razorpayOrder = await razorpay.orders.create(rzpOptions);

      // Step C: Atomically reserve inventory linked to this Razorpay Order ID (TTL: 15 mins)
      const { reservation, resolvedItems, calculatedTotal, expiresAt } = await reserveInventoryAtomic({
        tx,
        items: itemsToProcess,
        user_id: userId,
        razorpay_order_id: razorpayOrder.id,
        ttlMinutes: 15,
      });

      return { razorpayOrder, reservation, resolvedItems, calculatedTotal, expiresAt };
    });

    res.json({
      success: true,
      id: result.razorpayOrder.id,
      currency: result.razorpayOrder.currency,
      amount: result.razorpayOrder.amount,
      calculatedTotal: result.calculatedTotal,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('Razorpay order creation with reservation error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: error.code || 'PAYMENT_ORDER_ERROR',
      message: error.message || 'Error creating payment order',
    });
  }
};

/**
 * 2. Verify Payment & Idempotently Confirm Reservation into finalized Order
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingDetails } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_PARAMS',
        message: 'Missing Razorpay signature verification parameters',
      });
    }

    if (!RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        success: false,
        code: 'PAYMENT_NOT_CONFIGURED',
        message: 'Payment verification is not configured.',
      });
    }

    // Step A: Cryptographic HMAC SHA-256 verification
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        verified: false,
        code: 'INVALID_SIGNATURE',
        message: 'Invalid payment signature. Verification failed.',
      });
    }

    // Step B: Atomically confirm reservation into Order (Idempotent)
    const order = await prisma.$transaction(async (tx) => {
      return await confirmReservationAtomic({
        tx,
        razorpay_order_id,
        payment_id: razorpay_payment_id,
        user_id: req.user.id,
        shippingDetails: shippingDetails || {},
      });
    });

    res.json({
      success: true,
      verified: true,
      message: 'Payment verified and order created successfully',
      order,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: error.code || 'VERIFICATION_ERROR',
      message: error.message || 'Error verifying payment',
    });
  }
};

/**
 * 3. Release Checkout Hold (User cancelled or closed modal)
 */
export const releasePaymentHold = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;
    if (!razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'razorpay_order_id is required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      return await releaseReservationAtomic({
        tx,
        razorpay_order_id,
        reason: 'USER_ABANDONED_CHECKOUT',
      });
    });

    res.json({ success: true, message: 'Stock reservation released', result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error releasing stock hold', error: error.message });
  }
};

/**
 * 4. Razorpay Server-to-Server Webhook Handler
 */
export const razorpayWebhook = async (req, res) => {
  try {
    if (!RAZORPAY_WEBHOOK_SECRET) {
      return res.status(200).json({ success: true, message: 'Webhook secret not configured, ignored' });
    }

    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing signature' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        await prisma.$transaction(async (tx) => {
          await confirmReservationAtomic({
            tx,
            razorpay_order_id: razorpayOrderId,
            payment_id: paymentId,
            user_id: null,
            shippingDetails: {},
          });
        });
      }
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(200).json({ success: true, message: 'Webhook received' });
  }
};
