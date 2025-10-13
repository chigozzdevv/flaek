import express, { Router } from 'express';
import { unifiedAuth } from '@/middlewares/unified-auth';
import { datasetController } from '@/features/datasets/dataset.controller';
import { schemaValidator } from '@/middlewares/schema-validator';
import { createDatasetSchema } from '@/features/datasets/dataset.validators';
import { idempotency } from '@/middlewares/idempotency';

const router = Router();
router.use(unifiedAuth);
router.post('/', schemaValidator(createDatasetSchema), datasetController.create);
router.get('/', datasetController.list);
router.get('/:datasetId', datasetController.get);
router.post(
  '/:datasetId/ingest',
  idempotency(),
  express.text({ type: '*/*', limit: '10mb' }),
  datasetController.ingest
);
router.patch('/:datasetId', datasetController.update);
router.post('/:datasetId/deprecate', datasetController.deprecate);

export const datasetRoutes = router;
