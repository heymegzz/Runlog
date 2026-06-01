import { Router } from 'express';
import {
  listJobs,
  createJob,
  getJob,
  updateJob,
  deleteJob,
  pauseJob,
  resumeJob,
  triggerJob,
} from '../controllers/job.controller.js';
import { listJobExecutions } from '../controllers/execution.controller.js';
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
router.post('/:id/pause', requireRole(['admin', 'owner', 'developer']), pauseJob);
router.post('/:id/resume', requireRole(['admin', 'owner', 'developer']), resumeJob);
router.post('/:id/trigger', requireRole(['admin', 'owner', 'developer']), triggerJob);

// Executions for a specific job
router.get('/:id/executions', listJobExecutions);

export default router;
