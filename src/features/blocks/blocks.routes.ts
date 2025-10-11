import { Router } from 'express';
import { apiKeyAuth } from '@/middlewares/api-key-auth';
import { blocksController } from './blocks.controller';

const router = Router();

// Public endpoints (no auth required - blocks are public knowledge)
router.get('/', blocksController.listBlocks);
router.get('/categories', blocksController.getCategories);
router.get('/:blockId', blocksController.getBlock);

// Auth required for validation
router.use(apiKeyAuth);
router.post('/validate', blocksController.validatePipeline);

export const blocksRoutes = router;
