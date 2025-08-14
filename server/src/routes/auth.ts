import { Router } from 'express';
import { getChallenge, verifySignature } from '../controllers/authController';

const router = Router();

router.get('/challenge', getChallenge);
router.post('/verify', verifySignature);

export default router;
