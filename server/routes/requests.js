import { Router } from 'express';
import {
  cancelRequest, createRequest, myRequests, ownerRequests, updateRequestStatus,
} from '../controllers/requestController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const tenantOnly = [requireAuth, requireRole('tenant')];
const ownerOnly = [requireAuth, requireRole('owner')];

router.post('/', ...tenantOnly, createRequest);
router.get('/my', ...tenantOnly, myRequests);
router.get('/owner', ...ownerOnly, ownerRequests);
router.put('/:id', ...ownerOnly, updateRequestStatus);
router.patch('/:id', ...ownerOnly, updateRequestStatus);
router.delete('/:id', ...tenantOnly, cancelRequest);

export default router;
