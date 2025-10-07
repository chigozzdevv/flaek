import { DatasetModel, DatasetDocument } from '@/features/datasets/dataset.model';

export const datasetRepository = {
  async create(tenantId: string, name: string, schema: any, retentionDays?: number) {
    const ds = new DatasetModel({ tenantId, name, schema, retentionDays, batches: [] });
    return ds.save();
  },
  async listByTenant(tenantId: string) {
    return DatasetModel.find({ tenantId }).sort({ createdAt: -1 }).exec();
  },
  async getById(tenantId: string, id: string) {
    return DatasetModel.findOne({ _id: id, tenantId }).exec();
  },
  async addBatch(dataset: DatasetDocument, batch: { batchId: string; url: string; publicId?: string; sha256: string; rows: number }) {
    dataset.batches.push({ ...batch, createdAt: new Date() });
    await dataset.save();
    return dataset;
  },
  async removeBatchById(datasetId: string, batchId: string) {
    await DatasetModel.updateOne({ _id: datasetId }, { $pull: { batches: { batchId } } }).exec();
  },
};
