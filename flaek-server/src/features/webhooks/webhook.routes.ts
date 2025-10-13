import { Router } from 'express';
import { webhookController } from '@/features/webhooks/webhook.controller';
import { unifiedAuth } from '@/middlewares/unified-auth';
import { asyncHandler } from '@/utils/async-handler';

const router = Router();

router.post('/', unifiedAuth, asyncHandler(webhookController.create));
router.get('/', unifiedAuth, asyncHandler(webhookController.list));
router.get('/:webhookId', unifiedAuth, asyncHandler(webhookController.get));
router.put('/:webhookId', unifiedAuth, asyncHandler(webhookController.update));
router.delete('/:webhookId', unifiedAuth, asyncHandler(webhookController.remove));
router.post('/test', webhookController.test);

export const webhookRoutes = router;

