import { Router } from 'express';
import { apiKeyAuth } from '@/middlewares/api-key-auth';
import { creditController } from '@/features/credits/credit.controller';

const router = Router();
router.use(apiKeyAuth);
router.get('/', creditController.getBalance);
router.post('/topup', creditController.topup);
router.get('/ledger', creditController.ledger);

export const creditRoutes = router;

