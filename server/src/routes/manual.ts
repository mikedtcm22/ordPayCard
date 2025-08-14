import { Router } from 'express';
import { manualEntry, manualTopUp } from '../controllers/manualController';

const router = Router();

router.post('/entry', manualEntry);
router.post('/topup', manualTopUp);

export default router;
