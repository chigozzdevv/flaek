import { Router } from 'express';
import { tenantController } from '@/features/tenants/tenant.controller';
import { jwtAuth } from '@/middlewares/jwt-auth';
import { schemaValidator } from '@/middlewares/schema-validator';
import { createKeySchema, revokeKeySchema, updateTenantSchema } from '@/features/tenants/tenant.validators';

const router = Router();
router.use(jwtAuth);
router.get('/me', tenantController.me);
router.get('/keys', tenantController.listKeys);
router.post('/keys', schemaValidator(createKeySchema), tenantController.createKey);
router.post('/publishable-keys', tenantController.createPublishableKey);
router.post('/keys/:keyId/revoke', schemaValidator(revokeKeySchema), tenantController.revokeKey);
router.patch('/me', schemaValidator(updateTenantSchema), tenantController.updateName);

export const tenantRoutes = router;
