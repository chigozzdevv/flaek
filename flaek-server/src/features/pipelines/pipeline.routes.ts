import { Router } from 'express';
import { unifiedAuth } from '@/middlewares/unified-auth';
import { pipelineController } from './pipeline.controller';

const router = Router();

// Public templates
router.get('/templates', pipelineController.getTemplates);
router.get('/templates/:templateId', pipelineController.getTemplate);

// Auth required
router.use(unifiedAuth);
router.post('/operations', pipelineController.createOperation);
router.post('/execute', pipelineController.execute);
router.post('/validate', pipelineController.validate);

// Draft management
router.get('/draft', pipelineController.getDraft);
router.post('/draft', pipelineController.saveDraft);
router.delete('/draft', pipelineController.deleteDraft);

export const pipelineRoutes = router;
