import { Router } from 'express';
import { tenantController } from '@/features/tenants/tenant.controller';
import { jwtAuth } from '@/middlewares/jwt-auth';
import { schemaValidator } from '@/middlewares/schema-validator';
import { createKeySchema, revokeKeySchema } from '@/features/tenants/tenant.validators';

const router = Router();
router.use(jwtAuth);
router.get('/me', tenantController.me);
router.post('/keys', schemaValidator(createKeySchema), tenantController.createKey);
router.post('/publishable-keys', tenantController.createPublishableKey);
router.post('/keys/:keyId/revoke', schemaValidator(revokeKeySchema), tenantController.revokeKey);

export const tenantRoutes = router;
