import { Router } from 'express';
import { webhookController } from '@/features/webhooks/webhook.controller';

const router = Router();
router.post('/test', webhookController.test);

export const webhookRoutes = router;

