import { Router } from 'express';
import { getOverview, getJobAnalytics } from '../controllers/analytics.controller.js';
import authenticate from '../middleware/authenticate.js';
import requireWorkspace from '../middleware/requireWorkspace.js';

const router = Router();

router.get('/overview', authenticate, requireWorkspace, getOverview);
router.get('/jobs/:id', authenticate, requireWorkspace, getJobAnalytics);

export default router;
