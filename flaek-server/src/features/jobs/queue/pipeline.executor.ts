import { JobModel } from '@/features/jobs/job.model';
import { OperationDocument } from '@/features/operations/operation.model';
import { PipelineDefinition, PipelineEngine } from '@/features/pipelines/pipeline.engine';
import { jobRepository } from '@/features/jobs/job.repository';
import { Queue, JobsOptions } from 'bullmq';
import { getRedis } from '@/db/redis';
import { JOB_QUEUE } from '@/features/jobs/queue/job.queue';

export async function executePipeline(
  job: any,
  operation: OperationDocument,
  inputData: any,
  dataType: 'encrypted' | 'plaintext' = 'plaintext'
): Promise<void> {
  console.log(`[Pipeline Executor] Starting execution for job ${job.id} with ${dataType} inputs`);

  if (!operation.pipelineSpec || operation.pipelineSpec.type !== 'visual_pipeline') {
    throw new Error('Operation is not a visual pipeline');
  }

  const currentJob = await JobModel.findById(job.id).exec();
  if (currentJob?.status === 'cancelled') {
    console.log(`Job ${job.id} was cancelled during pipeline execution`);
    return;
  }

  const pipeline = operation.pipelineSpec.pipeline as PipelineDefinition;
  console.log(`[Pipeline Executor] MXE Program ID: ${operation.mxeProgramId}`);
  console.log(`[Pipeline Executor] Pipeline nodes: ${pipeline.nodes.length}, edges: ${pipeline.edges.length}`);

  const engine = new PipelineEngine(operation.mxeProgramId);

  try {
    console.log(`[Pipeline Executor] Executing pipeline...`);
    const result = await engine.execute(pipeline, inputData, {
      cluster: operation.accounts?.cluster,
      clientEncrypted: dataType === 'encrypted'
    });
    console.log(`[Pipeline Executor] Pipeline executed successfully, ${result.steps.length} steps`);

    const firstStepWithTx = result.steps.find(s => s.outputs?.tx);
    const arciumTx = firstStepWithTx?.outputs?.tx;
    const computationOffset = firstStepWithTx?.outputs?.computationOffset;
    const nonceB64 = firstStepWithTx?.outputs?.nonceB64;
    const clientPubKeyB64 = firstStepWithTx?.outputs?.clientPubKeyB64;

    // Mark job as running with Arcium refs; finalization worker will complete it
    await jobRepository.setStatus(job.id, 'running', {
      arciumRef: arciumTx,
      mxeProgramId: operation.mxeProgramId,
      computationOffset,
      enc: nonceB64 && clientPubKeyB64 ? { nonceB64, clientPubKeyB64, algo: 'rescue' } : undefined,
    });

    // Enqueue finalize job to wait for result
    const connection = getRedis();
    const queue = new Queue(JOB_QUEUE, { connection });
    const opts: JobsOptions = {
      removeOnComplete: 100,
      removeOnFail: 100,
      delay: 5000,
      attempts: 5,
      backoff: { type: 'exponential', delay: 3000 }
    };
    console.log(`[Pipeline Executor] Queueing finalize job for ${job.id} with 5s delay`);
    await queue.add('finalize', { jobId: job.id }, opts);
  } catch (error: any) {
    console.error(`[Pipeline Executor] Pipeline execution failed for job ${job.id}:`, error.message);
    
    // Parse and structure the error message for better UX
    let structuredError = error.message;
    
    // Try to extract block-level errors
    const blockMatch = error.message?.match(/Failed to execute circuit '([^']+)': (.+)/);
    if (blockMatch) {
      structuredError = JSON.stringify({
        title: `Block '${blockMatch[1]}' failed`,
        details: blockMatch[2],
        suggestion: 'Verify input values match the expected types and ranges for this block',
      });
    }
    
    await jobRepository.setStatus(job.id, 'failed', { 
      error: structuredError,
    });
    // Don't rethrow - job status is already set to failed
  }
}
