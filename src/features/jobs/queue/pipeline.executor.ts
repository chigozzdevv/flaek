import { JobModel } from '@/features/jobs/job.model';
import { OperationDocument } from '@/features/operations/operation.model';
import { PipelineDefinition, PipelineEngine } from '@/features/pipelines/pipeline.engine';
import { jobRepository } from '@/features/jobs/job.repository';
import { creditService } from '@/features/credits/credit.service';

export async function executePipeline(
  job: any,
  operation: OperationDocument,
  inputData: any
): Promise<void> {
  if (!operation.pipelineSpec || operation.pipelineSpec.type !== 'visual_pipeline') {
    throw new Error('Operation is not a visual pipeline');
  }

  const pipeline = operation.pipelineSpec.pipeline as PipelineDefinition;
  const engine = new PipelineEngine(operation.mxeProgramId);

  try {
    const result = await engine.execute(pipeline, inputData, {
      cluster: operation.accounts?.cluster,
    });

    const attestation = {
      provider: 'arcium',
      pipeline_execution: true,
      steps: result.steps.length,
      status: 'completed',
    };

    const cost = {
      compute_usd: 0.001 * result.steps.length,
      chain_usd: 0.00001 * result.steps.length,
      credits_used: result.steps.length,
    };

    await creditService.deduct(job.tenantId, result.steps.length, 'pipeline_computation', job.id);
    await jobRepository.setStatus(job.id, 'completed', { 
      result: result.outputs,
      attestation,
      cost,
    });
  } catch (error: any) {
    await jobRepository.setStatus(job.id, 'failed', { 
      error: error.message,
    });
    throw error;
  }
}
