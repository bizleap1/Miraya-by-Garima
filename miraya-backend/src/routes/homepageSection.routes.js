import express from 'express';
import {
  getNewArrivalsSection,
  updateNewArrivalsSection,
} from '../controllers/homepageSection.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public: Get New Arrivals section configuration & products
router.get('/new-arrivals', getNewArrivalsSection);

// Admin only: Update New Arrivals section configuration & items
router.put('/new-arrivals', authMiddleware, adminMiddleware, updateNewArrivalsSection);

export default router;
