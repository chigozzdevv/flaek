import { DatasetModel, DatasetDocument } from '@/features/datasets/dataset.model';

export const datasetRepository = {
  async create(tenantId: string, name: string, schema: any) {
    const ds = new DatasetModel({ tenantId, name, schema });
    return ds.save();
  },
  async listByTenant(tenantId: string) {
    return DatasetModel.find({ tenantId }).sort({ createdAt: -1 }).exec();
  },
  async getById(tenantId: string, id: string) {
    return DatasetModel.findOne({ _id: id, tenantId }).exec();
  },
  async updateStatus(datasetId: string, status: 'active' | 'deprecated') {
    await DatasetModel.updateOne({ _id: datasetId }, { status }).exec();
  },
  async update(datasetId: string, updates: { name?: string; schema?: any }) {
    await DatasetModel.updateOne({ _id: datasetId }, updates).exec();
  },
};
