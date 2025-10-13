import { Router } from 'express';
import { unifiedAuth } from '@/middlewares/unified-auth';
import { creditController } from '@/features/credits/credit.controller';

const router = Router();
router.use(unifiedAuth);
router.get('/', creditController.getBalance);
router.post('/topup', creditController.topup);
router.get('/ledger', creditController.ledger);

export const creditRoutes = router;

