import { Router } from 'express';
import { login } from '../controllers/authController';

const router = Router();

// Auth routes
router.post('/auth/login', login);

export default router;
