import { Router } from 'express';
import { unifiedAuth } from '@/middlewares/unified-auth';
import { attestationController } from '@/features/attestations/attestation.controller';

const router = Router();
router.use(unifiedAuth);
router.get('/:jobId', attestationController.get);
router.post('/verify', attestationController.verify);

export const attestationRoutes = router;

