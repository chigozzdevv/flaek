import { Router } from 'express';
import { publicController } from '@/features/public/public.controller';

const router = Router();
router.get('/tenants/:tenantId', publicController.getTenantPublic);
router.get('/mxe/:programId', publicController.getMxePublicKey);

export const publicRoutes = router;
