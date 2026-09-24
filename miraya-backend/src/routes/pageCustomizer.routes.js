import express from 'express';
import { getPageData, updatePageData } from '../controllers/pageCustomizer.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route to get page customizer data (like for New Arrivals)
router.get('/:pageName', getPageData);

// Admin route to update page customizer data
router.put('/:pageName', authMiddleware, adminMiddleware, updatePageData);

export default router;
