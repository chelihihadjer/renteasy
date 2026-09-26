import { Router } from 'express';
import { ownerStats } from '../controllers/statsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.get('/owner', requireAuth, requireRole('owner'), ownerStats);

export default router;
