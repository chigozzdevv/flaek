import express, { Router } from 'express';
import { apiKeyAuth } from '@/middlewares/api-key-auth';
import { datasetController } from '@/features/datasets/dataset.controller';
import { schemaValidator } from '@/middlewares/schema-validator';
import { createDatasetSchema } from '@/features/datasets/dataset.validators';
import { idempotency } from '@/middlewares/idempotency';

const router = Router();
router.use(apiKeyAuth);
router.post('/', schemaValidator(createDatasetSchema), datasetController.create);
router.get('/', datasetController.list);
router.get('/:datasetId', datasetController.get);
router.post(
  '/:datasetId/ingest',
  idempotency(),
  express.text({ type: '*/*', limit: '10mb' }),
  datasetController.ingest
);

export const datasetRoutes = router;
