import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getInvoice,
  resetAllOrdersController,
} from '../controllers/order.controller.js';
import { authMiddleware, optionalAuthMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Optional auth for creation to allow Guest Checkout
router.post('/', optionalAuthMiddleware, createOrder);

// Mandatory auth for fetching user's own orders
router.get('/', authMiddleware, getMyOrders);
router.get('/my-orders', authMiddleware, getMyOrders);
router.post('/:id/cancel', authMiddleware, cancelOrder);

// Invoice can be accessed via optional auth (verified by email or if user is owner)
router.get('/:id/invoice', optionalAuthMiddleware, getInvoice);

// Admin endpoints
router.get('/all', adminMiddleware, getAllOrders);
router.put('/:id/status', adminMiddleware, updateOrderStatus);
router.post('/reset-all', adminMiddleware, resetAllOrdersController);

export default router;

