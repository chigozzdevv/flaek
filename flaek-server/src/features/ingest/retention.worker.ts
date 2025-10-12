import { DatasetModel } from '@/features/datasets/dataset.model';
import { objectStore } from '@/storage/object-store';
import { datasetRepository } from '@/features/datasets/dataset.repository';

export async function runRetentionOnce(now = new Date()) {
  const datasets = await DatasetModel.find({ retentionDays: { $gt: 0 } }).select('_id retentionDays batches').exec();
  for (const ds of datasets) {
    const ttlMs = (ds.retentionDays || 0) * 24 * 60 * 60 * 1000;
    for (const b of ds.batches) {
      const age = now.getTime() - new Date(b.createdAt).getTime();
      if (age > ttlMs) {
        try {
          if (b.publicId) await objectStore.destroy(b.publicId);
        } catch {}
        await datasetRepository.removeBatchById(ds.id, b.batchId);
      }
    }
  }
}

