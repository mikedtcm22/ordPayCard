import { Router } from 'express';
import { getMembershipStatus } from '../controllers/membershipController';

const router = Router();

router.get('/status/:id', getMembershipStatus);

export default router;
