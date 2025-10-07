import mongoose, { Schema } from 'mongoose';

export type JobDocument = mongoose.Document & {
  tenantId: string;
  datasetId: string;
  operationId: string;
  source: { type: 'ephemeral'; ref: string } | { type: 'retained'; url: string } | { type: 'inline'; rows: any[] };
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelling' | 'cancelled';
  arciumRef?: string;
  result?: any;
  attestation?: any;
  error?: any;
  createdAt: Date;
  updatedAt: Date;
};

const jobSchema = new Schema<any>({
  tenantId: { type: String, required: true, index: true },
  datasetId: { type: String, required: true },
  operationId: { type: String, required: true },
  source: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['queued', 'running', 'completed', 'failed', 'cancelling', 'cancelled'], default: 'queued' },
  arciumRef: { type: String },
  result: { type: Schema.Types.Mixed },
  attestation: { type: Schema.Types.Mixed },
  error: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const JobModel = mongoose.models.Job || mongoose.model<JobDocument>('Job', jobSchema);

