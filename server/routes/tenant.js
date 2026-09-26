import { Router } from 'express';
import { getProperty, listProperties } from '../controllers/propertyController.js';
import { createRequest, myRequests } from '../controllers/requestController.js';
import { getFavorites, profile, toggleFavorite } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('tenant'));

router.get('/profile', profile);
router.get('/properties', listProperties);
router.get('/properties/:id', getProperty);
router.get('/favorites', getFavorites);
router.post('/favorites/:propertyId', toggleFavorite);
router.get('/requests', myRequests);
router.post('/requests/:propertyId', createRequest);

export default router;
