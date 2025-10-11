import { Router } from 'express';
import { healthRoutes } from '@/features/health/health.routes';
import { authRoutes } from '@/features/auth/auth.routes';
import { tenantRoutes } from '@/features/tenants/tenant.routes';
import { publicRoutes } from '@/features/public/public.routes';
import { datasetRoutes } from '@/features/datasets/dataset.routes';
import { operationRoutes } from '@/features/operations/operation.routes';
import { jobRoutes } from '@/features/jobs/job.routes';
import { webhookRoutes } from '@/features/webhooks/webhook.routes';
import { attestationRoutes } from '@/features/attestations/attestation.routes';
import { blocksRoutes } from '@/features/blocks/blocks.routes';
import { pipelineRoutes } from '@/features/pipelines/pipeline.routes';
import { creditRoutes } from '@/features/credits/credit.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/v1/public', publicRoutes);
router.use('/v1/datasets', datasetRoutes);
router.use('/v1/operations', operationRoutes);
router.use('/v1/jobs', jobRoutes);
router.use('/v1/webhooks', webhookRoutes);
router.use('/v1/attestations', attestationRoutes);
router.use('/v1/blocks', blocksRoutes);
router.use('/v1/pipelines', pipelineRoutes);
router.use('/v1/credits', creditRoutes);

export { router };
