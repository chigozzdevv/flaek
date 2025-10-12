import mongoose, { Schema } from 'mongoose';

export type DatasetBatch = {
  batchId: string;
  url: string;
  publicId?: string;
  sha256: string;
  rows: number;
  createdAt: Date;
};

export type DatasetDocument = mongoose.Document & {
  tenantId: string;
  name: string;
  schema: any;
  retentionDays?: number;
  status: 'active' | 'deprecated';
  batches: DatasetBatch[];
  createdAt: Date;
  updatedAt: Date;
};

const batchSchema = new Schema<any>({
  batchId: { type: String, required: true },
  url: { type: String, required: true },
  publicId: { type: String },
  sha256: { type: String, required: true },
  rows: { type: Number, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

const datasetSchema = new Schema<any>({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  schema: { type: Schema.Types.Mixed, required: true },
  retentionDays: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'deprecated'], default: 'active' },
  batches: { type: [batchSchema], default: [] },
}, { timestamps: true });

export const DatasetModel = mongoose.models.Dataset || mongoose.model<DatasetDocument>('Dataset', datasetSchema);
