import { Router } from 'express';
import { publicController } from '@/features/public/public.controller';

const router = Router();
router.get('/tenants/:tenantId', publicController.getTenantPublic);

export const publicRoutes = router;

