import { Router } from 'express';
import { webhookController } from '@/features/webhooks/webhook.controller';
import { apiKeyAuth } from '@/middlewares/api-key-auth';
import { asyncHandler } from '@/utils/async-handler';

const router = Router();

router.post('/', apiKeyAuth, asyncHandler(webhookController.create));
router.get('/', apiKeyAuth, asyncHandler(webhookController.list));
router.get('/:webhookId', apiKeyAuth, asyncHandler(webhookController.get));
router.put('/:webhookId', apiKeyAuth, asyncHandler(webhookController.update));
router.delete('/:webhookId', apiKeyAuth, asyncHandler(webhookController.remove));
router.post('/test', webhookController.test);

export const webhookRoutes = router;

