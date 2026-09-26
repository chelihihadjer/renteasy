import { Router } from 'express';
import {
  addFavorite, getFavorites, profile, removeFavorite, toggleFavorite,
} from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, profile);

router.use('/favorites', requireAuth, requireRole('tenant'));
router.get('/favorites', getFavorites);
router.post('/favorites/:propertyId', toggleFavorite);
router.put('/favorites/:propertyId', addFavorite);
router.delete('/favorites/:propertyId', removeFavorite);

export default router;
