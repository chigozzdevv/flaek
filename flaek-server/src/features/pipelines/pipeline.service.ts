import { PipelineEngine, PipelineDefinition, ExecutionResult } from './pipeline.engine';
import { operationRepository } from '../operations/operation.repository';
import { jobRepository } from '../jobs/job.repository';
import { sha256Hex } from '@/utils/hash';

async function createOperationFromPipeline(
  tenantId: string,
  pipeline: PipelineDefinition,
  metadata: {
    name: string;
    version: string;
    mxeProgramId: string;
  }
): Promise<any> {
  const pipelineSpec = {
    type: 'visual_pipeline',
    pipeline,
  };

  const artifactUri = `pipeline://${metadata.name}@${metadata.version}`;
  const pipelineHash = sha256Hex(JSON.stringify(pipelineSpec) + artifactUri);

  const inputNodes = pipeline.nodes.filter(n => n.type === 'input');
  const outputNodes = pipeline.nodes.filter(n => n.type === 'output');
  const inputs = inputNodes.map(n => n.data?.fieldName || n.id);
  const outputs = outputNodes.map(n => n.data?.fieldName || n.id);

  const clusterPubkey = process.env.ARCIUM_CLUSTER_PUBKEY;
  const accounts = clusterPubkey ? { cluster: clusterPubkey } : undefined;

  const operation = await operationRepository.create(tenantId, {
    name: metadata.name,
    version: metadata.version,
    pipelineSpec,
    pipelineHash,
    artifactUri,
    runtime: 'arcium',
    inputs,
    outputs,
    mxeProgramId: metadata.mxeProgramId,
    ...(accounts ? { accounts } : {}),
  });

  return {
    operation_id: operation.id,
    name: operation.name,
    version: operation.version,
    pipeline_spec: operation.pipelineSpec,
    pipeline_hash: operation.pipelineHash,
    artifact_uri: operation.artifactUri,
    inputs: operation.inputs,
    outputs: operation.outputs,
  };
}

async function executePipeline(
  tenantId: string,
  pipeline: PipelineDefinition,
  inputs: Record<string, any>,
  mxeProgramId: string,
  options?: {
    dryRun?: boolean;
    cluster?: string;
  }
): Promise<ExecutionResult> {
  const engine = new PipelineEngine(mxeProgramId);
  
  const result = await engine.execute(pipeline, inputs, options);
  
  return result;
}

async function executeOperationPipeline(
  tenantId: string,
  operationId: string,
  inputs: Record<string, any>,
  options?: {
    datasetId?: string;
    jobId?: string;
  }
): Promise<ExecutionResult> {
  const operation = await operationRepository.get(tenantId, operationId);
  
  if (!operation) {
    throw new Error('Operation not found');
  }

  if (operation.pipelineSpec?.type !== 'visual_pipeline') {
    throw new Error('Operation is not a visual pipeline');
  }

  const pipeline = operation.pipelineSpec.pipeline as PipelineDefinition;
  const engine = new PipelineEngine(operation.mxeProgramId);

  const result = await engine.execute(pipeline, inputs);

  if (options?.jobId) {
    await jobRepository.setStatus(options.jobId, 'completed', {
      result: result.outputs,
      executionSteps: result.steps,
      duration: result.duration,
    });
  }

  return result;
}

async function validatePipeline(pipeline: PipelineDefinition): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: any;
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const engine = new PipelineEngine('11111111111111111111111111111111');
    const executionOrder = (engine as any).topologicalSort(pipeline);
    
    const inputNodes = pipeline.nodes.filter(n => n.type === 'input');
    if (inputNodes.length === 0) {
      warnings.push('Pipeline has no input nodes');
    }

    const outputNodes = pipeline.nodes.filter(n => n.type === 'output');
    if (outputNodes.length === 0) {
      warnings.push('Pipeline has no output nodes');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        nodeCount: pipeline.nodes.length,
        edgeCount: pipeline.edges.length,
        executionOrder: executionOrder.length,
        inputNodes: inputNodes.length,
        outputNodes: outputNodes.length,
      },
    };
  } catch (error: any) {
    errors.push(error.message);
    return {
      valid: false,
      errors,
      warnings,
      stats: {},
    };
  }
}

function getPipelineTemplates() {
  return [
    {
      id: 'credit_score_simple',
      name: 'Simple Credit Score',
      description: 'Calculate credit score from income and debt',
      category: 'finance',
      pipeline: {
        nodes: [
          { id: 'input1', type: 'input', data: { fieldName: 'income' } },
          { id: 'input2', type: 'input', data: { fieldName: 'debt' } },
          { id: 'input3', type: 'input', data: { fieldName: 'credit_history' } },
          { id: 'input4', type: 'input', data: { fieldName: 'missed_payments' } },
          { id: 'credit', blockId: 'credit_score' },
          { id: 'output1', type: 'output', data: { fieldName: 'score' } },
          { id: 'output2', type: 'output', data: { fieldName: 'approved' } },
        ],
        edges: [
          { id: 'e1', source: 'input1', target: 'credit', sourceHandle: 'value', targetHandle: 'income' },
          { id: 'e2', source: 'input2', target: 'credit', sourceHandle: 'value', targetHandle: 'debt' },
          { id: 'e3', source: 'input3', target: 'credit', sourceHandle: 'value', targetHandle: 'credit_history' },
          { id: 'e4', source: 'input4', target: 'credit', sourceHandle: 'value', targetHandle: 'missed_payments' },
          { id: 'e5', source: 'credit', target: 'output1', sourceHandle: 'score', targetHandle: 'value' },
          { id: 'e6', source: 'credit', target: 'output2', sourceHandle: 'approved', targetHandle: 'value' },
        ],
      },
    },
    {
      id: 'conditional_pricing',
      name: 'Conditional Pricing',
      description: 'Calculate price with volume discount',
      category: 'business',
      pipeline: {
        nodes: [
          { id: 'input1', type: 'input', data: { fieldName: 'quantity' } },
          { id: 'input2', type: 'input', data: { fieldName: 'base_price' } },
          { id: 'threshold', blockId: 'greater_than', data: { b: 100 } },
          { id: 'discount', blockId: 'multiply', data: { b: 90 } }, // 10% discount
          { id: 'regular', blockId: 'multiply', data: { b: 100 } },
          { id: 'total_discount', blockId: 'divide', data: { b: 100 } },
          { id: 'total_regular', blockId: 'divide', data: { b: 100 } },
          { id: 'select', blockId: 'if_else' },
          { id: 'output', type: 'output', data: { fieldName: 'total_price' } },
        ],
        edges: [
          { id: 'e1', source: 'input1', target: 'threshold', targetHandle: 'a' },
          { id: 'e2', source: 'input1', target: 'discount', targetHandle: 'a' },
          { id: 'e3', source: 'input1', target: 'regular', targetHandle: 'a' },
          { id: 'e4', source: 'input2', target: 'discount', targetHandle: 'b' },
          { id: 'e5', source: 'input2', target: 'regular', targetHandle: 'b' },
          { id: 'e6', source: 'discount', target: 'total_discount', targetHandle: 'a' },
          { id: 'e7', source: 'regular', target: 'total_regular', targetHandle: 'a' },
          { id: 'e8', source: 'threshold', target: 'select', targetHandle: 'condition' },
          { id: 'e9', source: 'total_discount', target: 'select', targetHandle: 'true_value' },
          { id: 'e10', source: 'total_regular', target: 'select', targetHandle: 'false_value' },
          { id: 'e11', source: 'select', target: 'output' },
        ],
      },
    },
    {
      id: 'health_risk_analysis',
      name: 'Health Risk Analysis',
      description: 'Comprehensive health risk assessment',
      category: 'health',
      pipeline: {
        nodes: [
          { id: 'input1', type: 'input', data: { fieldName: 'age' } },
          { id: 'input2', type: 'input', data: { fieldName: 'bmi' } },
          { id: 'input3', type: 'input', data: { fieldName: 'smoker' } },
          { id: 'input4', type: 'input', data: { fieldName: 'exercise_hours' } },
          { id: 'input5', type: 'input', data: { fieldName: 'family_history' } },
          { id: 'health', blockId: 'health_risk' },
          { id: 'output1', type: 'output', data: { fieldName: 'risk_score' } },
          { id: 'output2', type: 'output', data: { fieldName: 'risk_category' } },
        ],
        edges: [
          { id: 'e1', source: 'input1', target: 'health', targetHandle: 'age' },
          { id: 'e2', source: 'input2', target: 'health', targetHandle: 'bmi' },
          { id: 'e3', source: 'input3', target: 'health', targetHandle: 'smoker' },
          { id: 'e4', source: 'input4', target: 'health', targetHandle: 'exercise_hours' },
          { id: 'e5', source: 'input5', target: 'health', targetHandle: 'family_history' },
          { id: 'e6', source: 'health', target: 'output1', sourceHandle: 'risk_score' },
          { id: 'e7', source: 'health', target: 'output2', sourceHandle: 'risk_category' },
        ],
      },
    },
  ];
}

export const pipelineService = {
  createOperationFromPipeline,
  executePipeline,
  executeOperationPipeline,
  validatePipeline,
  getPipelineTemplates,
};
