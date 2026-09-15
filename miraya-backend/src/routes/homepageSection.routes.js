import express from 'express';
import {
  getNewArrivalsSection,
  updateNewArrivalsSection,
} from '../controllers/homepageSection.controller.js';
import {
  getHomepageLayout,
  updateHomepageLayout,
  resetHomepageLayout,
} from '../controllers/homepageLayout.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Master Dynamic Homepage Layout (Shopify-Style Visual Builder)
router.get('/layout', getHomepageLayout);
router.put('/layout', authMiddleware, adminMiddleware, updateHomepageLayout);
router.post('/layout/reset', authMiddleware, adminMiddleware, resetHomepageLayout);

// New Arrivals section configuration & products
router.get('/new-arrivals', getNewArrivalsSection);
router.put('/new-arrivals', authMiddleware, adminMiddleware, updateNewArrivalsSection);

export default router;
