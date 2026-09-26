import { Router } from 'express';
import { getThread, sendMessage, unreadCounts } from '../controllers/messageController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('tenant', 'owner'));

router.get('/unread', unreadCounts);
router.get('/:requestId', getThread);
router.post('/:requestId', sendMessage);

export default router;
