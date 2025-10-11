import { Router } from 'express';
import { apiKeyAuth } from '@/middlewares/api-key-auth';
import { operationController } from '@/features/operations/operation.controller';
import { schemaValidator } from '@/middlewares/schema-validator';
import { createOperationSchema } from '@/features/operations/operation.validators';

const router = Router();
router.use(apiKeyAuth);
router.post('/', schemaValidator(createOperationSchema), operationController.create);
router.get('/', operationController.list);
router.get('/:operationId', operationController.get);
router.post('/:operationId/deprecate', operationController.deprecate);

export const operationRoutes = router;
