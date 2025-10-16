import mongoose, { Schema } from 'mongoose';

export type DatasetDocument = mongoose.Document & {
  tenantId: string;
  name: string;
  schema: any;
  status: 'active' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
};

const datasetSchema = new Schema<any>({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  schema: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['active', 'deprecated'], default: 'active' },
}, { timestamps: true });

export const DatasetModel = mongoose.models.Dataset || mongoose.model<DatasetDocument>('Dataset', datasetSchema);
