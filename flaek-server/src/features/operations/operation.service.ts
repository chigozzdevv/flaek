import { operationRepository } from '@/features/operations/operation.repository';
import { httpError } from '@/shared/errors';
import { PublicKey } from '@solana/web3.js';
import { getCompDefAccOffset, getCompDefAccAddress, getMempoolAccAddress, getExecutingPoolAccAddress, getStakingPoolAccAddress, getClockAccAddress } from '@arcium-hq/client';
import { sha256Hex } from '@/utils/hash';
import { DatasetModel } from '@/features/datasets/dataset.model';

async function create(tenantId: string, body: any) {
  const computed = sha256Hex(JSON.stringify(body.pipeline_spec) + body.artifact_uri);
  if (computed !== body.pipeline_hash) {
    throw httpError(400, 'invalid_body', 'pipeline_hash_mismatch');
  }

  let accounts = body.accounts || {};
  let compDefOffset: number | undefined = body.pipeline_spec?.comp_def_offset;
  if (!compDefOffset && body.pipeline_spec?.circuit_name) {
    try {
      const off = getCompDefAccOffset(body.pipeline_spec.circuit_name);
      compDefOffset = Buffer.from(off).readUInt32LE(0);
    } catch {}
  }
  if (body.runtime === 'arcium' && body.mxeProgramId) {
    try {
      const mxePk = new PublicKey(body.mxeProgramId);
      const mem = getMempoolAccAddress(mxePk);
      const exec = getExecutingPoolAccAddress(mxePk);
      accounts = {
        ...accounts,
        mxe: mxePk.toBase58(),
        mempool: mem.toBase58(),
        executingPool: exec.toBase58(),
      };
      if (typeof compDefOffset === 'number') {
        const compDef = getCompDefAccAddress(mxePk, compDefOffset);
        accounts = { ...accounts, compDefAcc: compDef.toBase58() };
      }
      try { 
        accounts = { 
          ...accounts, 
          poolAccount: getStakingPoolAccAddress().toBase58(), 
          clock: getClockAccAddress().toBase58() 
        }; 
      } catch {}
    } catch {}
  }

  const op = await operationRepository.create(tenantId, {
    name: body.name,
    version: body.version,
    pipelineSpec: body.pipeline_spec,
    pipelineHash: body.pipeline_hash,
    artifactUri: body.artifact_uri,
    runtime: body.runtime,
    inputs: body.inputs || [],
    outputs: body.outputs || [],
    mxeProgramId: body.mxeProgramId,
    compDefOffset,
    ...(body.programId ? { programId: body.programId } : {}),
    ...(body.method ? { method: body.method } : {}),
    ...(accounts ? { accounts } : {}),
    ...(body.datasetId ? { datasetId: body.datasetId } : {}),
    ...(body.retentionPolicy ? { retentionPolicy: body.retentionPolicy } : {}),
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
  
  let dataset = null;
  if (op.datasetId) {
    const ds = await DatasetModel.findById(op.datasetId).exec();
    if (ds) {
      dataset = {
        dataset_id: ds._id,
        name: ds.name,
        schema: ds.schema
      };
    }
  }
  
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
    dataset_id: op.datasetId,
    dataset: dataset,
    retention_policy: op.retentionPolicy,
    mxe_program_id: op.mxeProgramId,
  };
}

async function update(tenantId: string, operationId: string, updates: { name?: string; version?: string }) {
  const op = await operationRepository.get(tenantId, operationId);
  if (!op) throw httpError(404, 'not_found', 'operation_not_found');
  await operationRepository.update(operationId, updates);
  return { operation_id: operationId, ...updates };
}

async function deprecate(tenantId: string, operationId: string) {
  await operationRepository.deprecate(tenantId, operationId);
}

export const operationService = { create, list, get, update, deprecate };
