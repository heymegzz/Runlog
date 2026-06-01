import { Router } from 'express';
import { listExecutions, getExecution } from '../controllers/execution.controller.js';
import authenticate from '../middleware/authenticate.js';
import requireWorkspace from '../middleware/requireWorkspace.js';
import requireRole from '../middleware/requireRole.js';

const router = Router();

// Require auth and workspace context for all execution routes
// Also require at least developer role (viewers might not need access depending on requirements)
router.use(authenticate, requireWorkspace, requireRole(['admin', 'owner', 'developer', 'viewer']));

router.get('/', listExecutions);
router.get('/:id', getExecution);

export default router;
