import { Router } from 'express';
import { apiKeyAuth } from '@/middlewares/api-key-auth';
import { operationController } from '@/features/operations/operation.controller';

const router = Router();
router.use(apiKeyAuth);
router.post('/', operationController.create);
router.get('/', operationController.list);
router.get('/:operationId', operationController.get);
router.post('/:operationId/deprecate', operationController.deprecate);

export const operationRoutes = router;

