import { Router } from 'express';
import {
  listJobs,
  createJob,
  getJob,
  updateJob,
  deleteJob,
  toggleStatus,
  triggerJob,
} from '../controllers/job.controller.js';
import authenticate from '../middleware/authenticate.js';
import requireWorkspace from '../middleware/requireWorkspace.js';
import requireRole from '../middleware/requireRole.js';

const router = Router();

// Require auth and workspace context for all job routes
router.use(authenticate, requireWorkspace);

router.get('/', listJobs);
router.post('/', requireRole(['admin', 'owner', 'developer']), createJob);
router.get('/:id', getJob);
router.patch('/:id', requireRole(['admin', 'owner', 'developer']), updateJob);
router.delete('/:id', requireRole(['admin', 'owner']), deleteJob);

// Actions
router.post('/:id/toggle', requireRole(['admin', 'owner', 'developer']), toggleStatus);
router.post('/:id/trigger', requireRole(['admin', 'owner', 'developer']), triggerJob);

export default router;
