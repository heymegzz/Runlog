import { Router } from 'express';
import { register, login, refresh, logout, me } from '../controllers/auth.controller.js';
import authenticate from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
