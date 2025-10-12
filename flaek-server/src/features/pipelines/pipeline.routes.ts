import { Router } from 'express';
import { apiKeyAuth } from '@/middlewares/api-key-auth';
import { pipelineController } from './pipeline.controller';

const router = Router();

// Public templates
router.get('/templates', pipelineController.getTemplates);
router.get('/templates/:templateId', pipelineController.getTemplate);

// Auth required
router.use(apiKeyAuth);
router.post('/operations', pipelineController.createOperation);
router.post('/execute', pipelineController.execute);
router.post('/validate', pipelineController.validate);

export const pipelineRoutes = router;
