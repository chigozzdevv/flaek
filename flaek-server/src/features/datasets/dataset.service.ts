import { datasetRepository } from '@/features/datasets/dataset.repository';
import { httpError } from '@/shared/errors';
import { newId } from '@/utils/id';
import { objectStore } from '@/storage/object-store';
import { sha256Hex } from '@/utils/hash';
import { compileValidator } from '@/utils/schema';
import { putEphemeral } from '@/features/ingest/ephemeral.store';
import { env } from '@/config/env';
import { parseCsvToObjects } from '@/utils/csv';
import { jobService } from '@/features/jobs/job.service';

async function create(tenantId: string, name: string, schema: any, retentionDays?: number) {
  return datasetRepository.create(tenantId, name, schema, retentionDays);
}

async function list(tenantId: string) {
  const items = await datasetRepository.listByTenant(tenantId);
  return { items: items.map(i => ({ 
    dataset_id: i.id, 
    name: i.name, 
    created_at: i.createdAt, 
    status: i.status,
    field_count: i.schema?.properties ? Object.keys(i.schema.properties).length : 0,
    batch_count: i.batches?.length || 0,
  })) };
}

async function get(tenantId: string, datasetId: string) {
  const ds = await datasetRepository.getById(tenantId, datasetId);
  if (!ds) throw httpError(404, 'not_found', 'dataset_not_found');
  return { dataset_id: ds.id, name: ds.name, schema: ds.schema, retention_days: ds.retentionDays, created_at: ds.createdAt, status: ds.status };
}

async function update(tenantId: string, datasetId: string, updates: { name?: string; schema?: any; retentionDays?: number }) {
  const ds = await datasetRepository.getById(tenantId, datasetId);
  if (!ds) throw httpError(404, 'not_found', 'dataset_not_found');
  await datasetRepository.update(datasetId, updates);
  return { dataset_id: datasetId, ...updates };
}

async function deprecate(tenantId: string, datasetId: string) {
  const ds = await datasetRepository.getById(tenantId, datasetId);
  if (!ds) throw httpError(404, 'not_found', 'dataset_not_found');
  await datasetRepository.updateStatus(datasetId, 'deprecated');
  return { dataset_id: datasetId, status: 'deprecated' };
}

async function ingest(tenantId: string, datasetId: string, body: string, contentType?: string, runOperationId?: string) {
  const ds = await datasetRepository.getById(tenantId, datasetId);
  if (!ds) throw httpError(404, 'not_found', 'dataset_not_found');

  let rows: any[] = [];
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('text/csv') || ct.includes('application/csv')) {
    rows = parseCsvToObjects(body);
    // CSV header checks
    const props = (ds.schema && ds.schema.properties) ? Object.keys(ds.schema.properties) : [];
    const required: string[] = Array.isArray(ds.schema?.required) ? ds.schema.required : [];
    const additional = ds.schema?.additionalProperties;
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    // Required columns
    for (const r of required) {
      if (!headers.includes(r)) throw httpError(400, 'invalid_body', `csv_missing_required_column_${r}`);
    }
    if (additional === false && props.length > 0) {
      for (const h of headers) {
        if (!props.includes(h)) throw httpError(400, 'invalid_body', `csv_unexpected_column_${h}`);
      }
    }
  } else {
    const lines = body.split(/\r?\n/).filter(l => l.trim().length > 0);
    for (let i = 0; i < lines.length; i++) {
      try {
        rows.push(JSON.parse(lines[i]));
      } catch {
        throw httpError(400, 'invalid_body', `invalid_jsonl_at_line_${i + 1}`);
      }
    }
  }

  const validate = compileValidator(ds.schema);
  for (let i = 0; i < rows.length; i++) {
    const ok = validate(rows[i]);
    if (!ok) {
      throw httpError(400, 'invalid_body', 'schema_validation_failed', { line: i + 1, errors: validate.errors });
    }
  }

  const buffer = Buffer.from(body, 'utf8');
  const sha = sha256Hex(buffer);
  const batchId = newId('batch');

  // Retained mode
  if ((ds.retentionDays || 0) > 0) {
    const upload = await objectStore.upload(buffer, `datasets/${datasetId}/${batchId}`);
    const url = upload.secure_url || upload.url || '';
    const publicId = upload.public_id as string | undefined;
    await datasetRepository.addBatch(ds, { batchId, url, publicId, sha256: sha, rows: rows.length });
    if (runOperationId) {
      const job = await jobService.createFromIngest({
        tenantId,
        datasetId,
        operationId: runOperationId,
        source: { type: 'retained', url },
        rows,
      });
      return { batch_id: batchId, rows_accepted: rows.length, dataset_id: ds.id, status: 'queued', job_id: job.job_id } as any;
    }
    return { batch_id: batchId, rows_accepted: rows.length, dataset_id: ds.id, status: 'queued' };
  }

  // Ephemeral mode (default)
  if (!runOperationId) {
    throw httpError(400, 'invalid_state', 'ephemeral_ingest_requires_run');
  }
  const { ref } = await putEphemeral(buffer, env.INGEST_TTL_SECONDS);
  const job = await jobService.createFromIngest({
    tenantId,
    datasetId,
    operationId: runOperationId,
    source: { type: 'ephemeral', ref },
    rows,
  });
  return { batch_id: batchId, rows_accepted: rows.length, dataset_id: ds.id, status: 'queued', job_id: job.job_id } as any;
}

export const datasetService = { create, list, get, update, ingest, deprecate };
