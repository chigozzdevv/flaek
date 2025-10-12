import { Router } from 'express';
import { healthController } from '@/features/health/health.controller';

const router = Router();
router.get('/', healthController.index);

export const healthRoutes = router;

