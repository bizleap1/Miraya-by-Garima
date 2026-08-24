import { Router } from 'express';
import { addReview, deleteReview } from '../controllers/review.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authMiddleware, addReview);
router.delete('/:id', authMiddleware, adminMiddleware, deleteReview);

export default router;
