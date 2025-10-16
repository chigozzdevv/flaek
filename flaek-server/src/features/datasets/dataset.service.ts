import { datasetRepository } from '@/features/datasets/dataset.repository';
import { httpError } from '@/shared/errors';

async function create(tenantId: string, name: string, schema: any) {
  return datasetRepository.create(tenantId, name, schema);
}

async function list(tenantId: string) {
  const items = await datasetRepository.listByTenant(tenantId);
  return { items: items.map(i => ({ 
    dataset_id: i.id, 
    name: i.name, 
    created_at: i.createdAt, 
    status: i.status,
    field_count: i.schema?.properties ? Object.keys(i.schema.properties).length : 0,
  })) };
}

async function get(tenantId: string, datasetId: string) {
  const ds = await datasetRepository.getById(tenantId, datasetId);
  if (!ds) throw httpError(404, 'not_found', 'dataset_not_found');
  return { dataset_id: ds.id, name: ds.name, schema: ds.schema, created_at: ds.createdAt, status: ds.status };
}

async function update(tenantId: string, datasetId: string, updates: { name?: string; schema?: any }) {
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

export const datasetService = { create, list, get, update, deprecate };
