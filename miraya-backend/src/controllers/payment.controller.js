/**
 * =========================================================================
 * MIRAYA BY GARIMA — PAYMENT CONTROLLER WITH RAZORPAY STANDARD CHECKOUT
 * Flow:
 * 1. createRazorpayOrder -> Validates amount (>= 100 paise) -> Calls Razorpay API -> Returns { order_id, amount, currency }
 * 2. verifyRazorpayPayment -> HMAC-SHA256 signature verification -> Confirms order & records payment
 * 3. releasePaymentHold -> Releases held stock if customer cancels checkout
 * 4. razorpayWebhook -> Server-to-server webhook confirmation
 * =========================================================================
 */

import crypto from 'crypto';
import razorpay from '../config/razorpay.js';
import prisma from '../prisma/client.js';
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } from '../config/env.js';
import {
  reserveInventoryAtomic,
  confirmReservationAtomic,
  releaseReservationAtomic
} from '../services/inventory.service.js';
import { sendOrderConfirmationEmail } from '../utils/email.service.js';

/**
 * 1. Create Razorpay Order
 * Endpoint: POST /api/create-order or POST /api/payments/create-order
 * Request: { amount (in paise), currency, receipt, items, shippingDetails, notes }
 * Return: { success: true, order_id, id, amount, currency, receipt }
 * Minimum amount: 100 paise (₹1.00)
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        code: 'PAYMENT_NOT_CONFIGURED',
        message: 'Payment gateway is not configured on the server.',
      });
    }

    const userId = req.user?.id || null;
    const userEmail = req.user?.email || req.body?.email || req.body?.shippingDetails?.email || 'guest@mirayabygarima.com';
    const {
      currency = 'INR',
      receipt: customReceipt,
      items: directItems,
      couponCode: requestCouponCode,
      coupon: fallbackCouponCode,
      shippingDetails,
      notes = {}
    } = req.body;

    const couponCode = (requestCouponCode || fallbackCouponCode || '').trim();

    let itemsToProcess = [];
    if (Array.isArray(directItems) && directItems.length > 0) {
      itemsToProcess = directItems;
    } else if (userId) {
      const cartItems = await prisma.cartItem.findMany({
        where: { user_id: userId },
        include: { product: true, variant: true },
      });
      if (cartItems.length > 0) {
        itemsToProcess = cartItems.map(ci => ({
          product_id: ci.product_id,
          variant_id: ci.variant_id,
          size: ci.size,
          quantity: ci.quantity,
        }));
      }
    }

    if (!itemsToProcess || itemsToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_ITEMS',
        message: 'Cart items are required for order creation. Authoritative server pricing requires valid items.',
      });
    }

    // 1. Authoritative Server-Side Price & Stock Calculation from Database
    let serverSubtotal = 0;
    const validatedItems = [];

    for (const item of itemsToProcess) {
      const rawPid = item.product_id || item.productId || item.id;
      const pid = typeof rawPid === 'number' ? rawPid : parseInt(String(rawPid || '').split('-').pop(), 10);
      const qty = Math.max(1, parseInt(item.quantity || item.qty || 1, 10));

      if (isNaN(pid)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_PRODUCT_ID',
          message: `Invalid product ID in checkout request.`,
        });
      }

      const product = await prisma.product.findUnique({
        where: { id: pid },
        include: { variants: true },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          code: 'PRODUCT_NOT_FOUND',
          message: `Product ID ${pid} does not exist in store catalog.`,
        });
      }

      const requestedSize = (item.size || item.selectedSize || '').trim();
      let variant = null;
      if (item.variant_id) {
        variant = product.variants.find(v => v.id === parseInt(item.variant_id, 10));
      } else if (requestedSize) {
        variant = product.variants.find(v => v.size.toLowerCase() === requestedSize.toLowerCase());
      }

      if (!variant && product.variants.length > 0) {
        variant = product.variants[0];
      }

      if (!variant) {
        return res.status(404).json({
          success: false,
          code: 'VARIANT_NOT_FOUND',
          message: `Variant for "${product.name}" (Size: ${requestedSize || 'N/A'}) was not found.`,
        });
      }

      if (!variant.is_active) {
        return res.status(400).json({
          success: false,
          code: 'VARIANT_INACTIVE',
          message: `Product "${product.name}" (${variant.size}) is currently inactive.`,
        });
      }

      const availableStock = Math.max(0, variant.stock - variant.reserved_stock);
      if (qty > availableStock) {
        return res.status(409).json({
          success: false,
          code: 'OUT_OF_STOCK',
          message: `Insufficient stock for "${product.name}" (${variant.size}). Available: ${availableStock}, Requested: ${qty}`,
          availableStock,
        });
      }

      const itemUnitPrice = Number(variant.price || product.price);
      const itemSubtotal = itemUnitPrice * qty;
      serverSubtotal += itemSubtotal;

      validatedItems.push({
        product_id: product.id,
        variant_id: variant.id,
        sku: variant.sku,
        size: variant.size,
        quantity: qty,
        price: itemUnitPrice,
        total_price: itemSubtotal,
      });
    }

    // 2. Authoritative Coupon Discount Calculation
    let discountAmount = 0;
    let appliedCouponCode = null;

    if (couponCode) {
      const { validateCouponServerSide } = await import('./coupon.controller.js');
      const couponResult = await validateCouponServerSide(couponCode, serverSubtotal);

      if (!couponResult.valid) {
        return res.status(400).json({
          success: false,
          code: couponResult.code || 'INVALID_COUPON',
          message: couponResult.message,
        });
      }

      discountAmount = couponResult.discountAmount;
      appliedCouponCode = couponResult.coupon.code;
    }

    const finalPayableTotal = Math.max(0, serverSubtotal - discountAmount);
    const amountInPaise = Math.round(finalPayableTotal * 100);

    if (amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_AMOUNT',
        message: 'Minimum order amount must be at least 100 paise (₹1.00)',
      });
    }

    const receiptId = customReceipt || `rcpt_${userId || 'gst'}_${Date.now().toString().slice(-8)}`;

    const rzpOptions = {
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: receiptId,
      notes: {
        user_id: String(userId || 'guest'),
        user_email: userEmail,
        coupon_code: appliedCouponCode || 'NONE',
        server_subtotal: String(serverSubtotal),
        server_discount: String(discountAmount),
        ...(typeof notes === 'object' ? notes : {}),
      },
    };

    // Call Razorpay API to create order
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(rzpOptions);
    } catch (rzpErr) {
      if (process.env.NODE_ENV !== 'production' && !RAZORPAY_KEY_ID?.startsWith('rzp_live') && (rzpErr.statusCode === 401 || RAZORPAY_KEY_ID?.includes('test'))) {
        razorpayOrder = {
          id: `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          amount: amountInPaise,
          currency: currency || 'INR',
          receipt: receiptId,
          status: 'created',
        };
      } else {
        throw rzpErr;
      }
    }

    let reservationResult = null;
    // Reserve stock atomically with server-calculated total
    try {
      reservationResult = await prisma.$transaction(async (tx) => {
        return await reserveInventoryAtomic({
          tx,
          items: validatedItems,
          user_id: userId,
          razorpay_order_id: razorpayOrder.id,
          coupon_code: appliedCouponCode,
          total_amount_override: finalPayableTotal,
          ttlMinutes: 15,
        });
      });
    } catch (reserveErr) {
      console.warn('[Reservation] Stock reservation warning:', reserveErr.message);
    }

    return res.status(200).json({
      success: true,
      order_id: razorpayOrder.id,
      id: razorpayOrder.id,
      key_id: RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      status: razorpayOrder.status,
      serverSubtotal,
      discountAmount,
      calculatedTotal: finalPayableTotal,
      couponApplied: appliedCouponCode,
      expiresAt: reservationResult?.expiresAt,
    });

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      code: error.code || 'PAYMENT_ORDER_ERROR',
      message: error.message || 'Error creating Razorpay order',
    });
  }
};


/**
 * 2. Verify Payment Signature
 * Endpoint: POST /api/verify-payment or POST /api/payments/verify
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Compare generated signature with razorpay_signature
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      order_id,
      razorpay_payment_id,
      payment_id,
      razorpay_signature,
      signature,
      shippingDetails,
      orderData
    } = req.body;

    const rzpOrderId = razorpay_order_id || order_id;
    const rzpPaymentId = razorpay_payment_id || payment_id;
    const rzpSignature = razorpay_signature || signature;

    // Validate missing fields -> 400
    if (!rzpOrderId || !rzpPaymentId || !rzpSignature) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_PARAMS',
        message: 'Missing required signature verification parameters: order_id, payment_id, and signature are required.',
      });
    }

    if (!RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        code: 'PAYMENT_NOT_CONFIGURED',
        message: 'Payment verification secret is not configured on the server.',
      });
    }

    // Step A: Cryptographic HMAC SHA-256 signature verification
    const body = `${rzpOrderId}|${rzpPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== rzpSignature) {
      return res.status(400).json({
        success: false,
        verified: false,
        code: 'INVALID_SIGNATURE',
        message: 'Invalid payment signature. Verification failed. Order will not be marked as paid.',
      });
    }

    // Step B: Atomically confirm reservation into Order or record direct order
    let finalizedOrder = null;

    const existingReservation = await prisma.inventoryReservation.findUnique({
      where: { razorpay_order_id: rzpOrderId },
    });

    if (existingReservation) {
      finalizedOrder = await prisma.$transaction(async (tx) => {
        return await confirmReservationAtomic({
          tx,
          razorpay_order_id: rzpOrderId,
          payment_id: rzpPaymentId,
          user_id: req.user?.id || existingReservation.user_id,
          shippingDetails: shippingDetails || {},
        });
      });
    } else {
      // Check if order already exists in DB
      const existingOrder = await prisma.order.findFirst({
        where: { razorpay_order_id: rzpOrderId },
        include: { items: { include: { product: true, variant: true } }, payments: true, user: true },
      });

      if (existingOrder) {
        finalizedOrder = existingOrder;
      } else if (orderData) {
        const calculatedTotal = Number(orderData.total || orderData.amount || 0);
        const shipName = shippingDetails?.fullName || orderData.shipping_name || req.user?.name || 'Valued Client';
        const shipPhone = shippingDetails?.phone || orderData.shipping_phone || req.user?.phone || '';
        const shipAddr = shippingDetails?.addressLine1 || shippingDetails?.line1 || orderData.address || '';
        const shipCity = shippingDetails?.city || orderData.shipping_city || '';
        const shipState = shippingDetails?.state || orderData.shipping_state || '';
        const shipPincode = shippingDetails?.pincode || orderData.shipping_pincode || '';

        finalizedOrder = await prisma.$transaction(async (tx) => {
          const newOrder = await tx.order.create({
            data: {
              user_id: req.user?.id || null,
              total: calculatedTotal,
              status: 'processing',
              payment_id: rzpPaymentId,
              razorpay_order_id: rzpOrderId,
              shipping_name: shipName,
              shipping_phone: shipPhone,
              shipping_address: shipAddr,
              shipping_city: shipCity,
              shipping_state: shipState,
              shipping_pincode: shipPincode,
            },
            include: { items: true, user: true },
          });

          await tx.payment.create({
            data: {
              order_id: newOrder.id,
              gateway: 'RAZORPAY',
              gateway_order_id: rzpOrderId,
              gateway_payment_id: rzpPaymentId,
              amount: calculatedTotal,
              currency: 'INR',
              status: 'PAID',
              payment_reference: rzpPaymentId,
            },
          });

          return newOrder;
        });
      }
    }

    // Send confirmation email if email available
    const recipientEmail = shippingDetails?.email || req.user?.email || finalizedOrder?.user?.email;
    if (recipientEmail && finalizedOrder) {
      sendOrderConfirmationEmail(recipientEmail, finalizedOrder)
        .catch(err => console.error('[Order Confirmation Email error]', err));
    }

    // Realtime broadcast after DB commit
    if (finalizedOrder) {
      const { emitOrderCreated, emitInventoryUpdated } = await import('../services/realtime.service.js');
      emitOrderCreated(finalizedOrder);
      if (finalizedOrder.items && Array.isArray(finalizedOrder.items)) {
        finalizedOrder.items.forEach(it => {
          if (it.variant) {
            emitInventoryUpdated({
              variantId: it.variant_id,
              productId: it.product_id,
              stock: it.variant.stock,
              reserved_stock: it.variant.reserved_stock || 0,
            });
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      verified: true,
      message: 'Payment verified and order confirmed successfully',
      order: finalizedOrder,
      order_id: rzpOrderId,
      payment_id: rzpPaymentId,
    });


  } catch (error) {
    console.error('Payment verification error:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      code: error.code || 'VERIFICATION_ERROR',
      message: error.message || 'Error verifying payment signature',
    });
  }
};

/**
 * 3. Release Checkout Hold (User cancelled or closed modal)
 * Endpoint: POST /api/payments/release-hold or POST /api/release-hold
 */
export const releasePaymentHold = async (req, res) => {
  try {
    const { razorpay_order_id, order_id } = req.body;
    const rzpOrderId = razorpay_order_id || order_id;

    if (!rzpOrderId) {
      return res.status(400).json({ success: false, message: 'razorpay_order_id is required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      return await releaseReservationAtomic({
        tx,
        razorpay_order_id: rzpOrderId,
        reason: 'USER_ABANDONED_CHECKOUT',
      });
    });

    return res.json({ success: true, message: 'Stock reservation released', result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error releasing stock hold', error: error.message });
  }
};

/**
 * 4. Razorpay Server-to-Server Webhook Handler
 * Endpoint: POST /api/payments/webhook
 */
export const razorpayWebhook = async (req, res) => {
  try {
    if (!RAZORPAY_WEBHOOK_SECRET) {
      return res.status(200).json({ success: true, message: 'Webhook secret not configured, ignored' });
    }

    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing webhook signature' });
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

    return res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(200).json({ success: true, message: 'Webhook received' });
  }
};
