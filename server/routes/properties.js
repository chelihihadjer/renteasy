import { Router } from 'express';
import {
  createProperty, deleteProperty, getProperty, listProperties, myProperties, updateProperty,
} from '../controllers/propertyController.js';
import { createReview, deleteMyReview, listReviews } from '../controllers/reviewController.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const ownerOnly = [requireAuth, requireRole('owner')];

router.get('/', listProperties);
router.get('/mine', ...ownerOnly, myProperties);
router.get('/:id', optionalAuth, getProperty);
router.post('/', ...ownerOnly, createProperty);
router.put('/:id', ...ownerOnly, updateProperty);
router.patch('/:id', ...ownerOnly, updateProperty);
router.delete('/:id', ...ownerOnly, deleteProperty);

router.get('/:id/reviews', listReviews);
router.post('/:id/reviews', requireAuth, requireRole('tenant'), createReview);
router.delete('/:id/reviews/mine', requireAuth, requireRole('tenant'), deleteMyReview);

export default router;
