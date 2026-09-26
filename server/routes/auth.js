import { Router } from 'express';
import { login, me, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', register);
router.post('/login', rateLimit({ max: 10 }), login);
router.get('/me', requireAuth, me);

export default router;
