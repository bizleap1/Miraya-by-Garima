import { Router } from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  releasePaymentHold,
  razorpayWebhook
} from '../controllers/payment.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { paymentLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Authenticated payment endpoints with rate limiting
router.post('/create-order', authMiddleware, paymentLimiter, createRazorpayOrder);
router.post('/verify', authMiddleware, paymentLimiter, verifyRazorpayPayment);
router.post('/release-hold', authMiddleware, releasePaymentHold);

// Razorpay webhook — server-to-server, uses signature verification
router.post('/webhook', razorpayWebhook);

export default router;
