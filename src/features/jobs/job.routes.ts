import { Router } from 'express';
import { apiKeyAuth } from '@/middlewares/api-key-auth';
import { jobController } from '@/features/jobs/job.controller';

const router = Router();
router.use(apiKeyAuth);
router.post('/', jobController.create);
router.get('/', jobController.list);
router.get('/:jobId', jobController.get);
router.post('/:jobId/cancel', jobController.cancel);

export const jobRoutes = router;

