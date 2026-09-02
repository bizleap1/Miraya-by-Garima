import { Router } from 'express';
import {
  getReviews,
  getProductReviews,
  addReview,
  adminCreateReview,
  updateReview,
  toggleReviewApproval,
  likeReview,
  deleteReview,
  getUserReviews,
} from '../controllers/review.controller.js';
import { authMiddleware, authorizeRoles, optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// Public / Customer Endpoints
router.get('/', getReviews);
router.get('/product/:productId', getProductReviews);
router.get('/user/my', authMiddleware, getUserReviews);
router.post('/', optionalAuthMiddleware, upload.array('images', 5), addReview);
router.post('/:id/like', likeReview);

// Admin & Staff Review Management Endpoints
router.post(
  '/admin-create',
  authMiddleware,
  authorizeRoles('admin', 'super_admin', 'store_manager'),
  upload.array('images', 5),
  adminCreateReview
);

router.put(
  '/:id',
  authMiddleware,
  authorizeRoles('admin', 'super_admin', 'store_manager'),
  upload.array('images', 5),
  updateReview
);

router.patch(
  '/:id/toggle-approve',
  authMiddleware,
  authorizeRoles('admin', 'super_admin', 'store_manager'),
  toggleReviewApproval
);

// Review Deletion (Admin/Staff OR Review Owner)
router.delete(
  '/:id',
  authMiddleware,
  deleteReview
);

export default router;
