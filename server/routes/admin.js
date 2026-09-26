import { Router } from 'express';
import { listAllProperties, listUsers, overview, removeProperty } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/overview', overview);
router.get('/users', listUsers);
router.get('/properties', listAllProperties);
router.delete('/properties/:id', removeProperty);

export default router;
