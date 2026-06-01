import { Router } from 'express';
import { listApiKeys, createApiKey, revokeApiKey } from '../controllers/apikey.controller.js';
import authenticate from '../middleware/authenticate.js';
import requireWorkspace from '../middleware/requireWorkspace.js';
import requireRole from '../middleware/requireRole.js';

const router = Router();

router.get('/', authenticate, requireWorkspace, listApiKeys);
router.post('/', authenticate, requireWorkspace, requireRole(['owner','admin']), createApiKey);
router.delete('/:id', authenticate, requireWorkspace, requireRole(['owner','admin']), revokeApiKey);

export default router;
