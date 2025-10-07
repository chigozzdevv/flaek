import { operationRepository } from '@/features/operations/operation.repository';
import { httpError } from '@/shared/errors';

async function create(tenantId: string, body: any) {
  const op = await operationRepository.create(tenantId, {
    name: body.name,
    version: body.version,
    pipelineSpec: body.pipeline_spec,
    pipelineHash: body.pipeline_hash,
    artifactUri: body.artifact_uri,
    runtime: body.runtime,
    inputs: body.inputs || [],
    outputs: body.outputs || [],
    ...(body.programId ? { programId: body.programId } : {}),
    ...(body.method ? { method: body.method } : {}),
    ...(body.accounts ? { accounts: body.accounts } : {}),
  });
  return { operation_id: op.id, pipeline_hash: op.pipelineHash };
}

async function list(tenantId: string) {
  const items = await operationRepository.list(tenantId);
  return { items: items.map(i => ({ operation_id: i.id, name: i.name, version: i.version, pipeline_hash: i.pipelineHash, created_at: i.createdAt, status: i.status })) };
}

async function get(tenantId: string, operationId: string) {
  const op = await operationRepository.get(tenantId, operationId);
  if (!op) throw httpError(404, 'not_found', 'operation_not_found');
  return {
    operation_id: op.id,
    name: op.name,
    version: op.version,
    pipeline_spec: op.pipelineSpec,
    pipeline_hash: op.pipelineHash,
    artifact_uri: op.artifactUri,
    runtime: op.runtime,
    inputs: op.inputs,
    outputs: op.outputs,
    status: op.status,
  };
}

async function deprecate(tenantId: string, operationId: string) {
  await operationRepository.deprecate(tenantId, operationId);
}

export const operationService = { create, list, get, deprecate };
