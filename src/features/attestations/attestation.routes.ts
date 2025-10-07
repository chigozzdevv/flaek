import { Router } from 'express';
import { apiKeyAuth } from '@/middlewares/api-key-auth';
import { attestationController } from '@/features/attestations/attestation.controller';

const router = Router();
router.use(apiKeyAuth);
router.get('/:jobId', attestationController.get);
router.post('/verify', attestationController.verify);

export const attestationRoutes = router;

