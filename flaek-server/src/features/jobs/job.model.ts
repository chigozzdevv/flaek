import mongoose, { Schema } from 'mongoose';

export type JobDocument = mongoose.Document & {
  tenantId: string;
  datasetId: string;
  operationId: string;
  source: { type: 'encrypted'; data: any };
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelling' | 'cancelled';
  arciumRef?: string;
  result?: any;
  attestation?: any;
  error?: any;
  mxeProgramId?: string;
  computationOffset?: string;
  enc?: { nonceB64: string; clientPubKeyB64: string; algo: 'rescue' };
  callbackUrl?: string;
  cost?: { compute_usd: number; chain_usd: number; credits_used: number };
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
  mxeProgramId: { type: String },
  computationOffset: { type: String },
  enc: { type: Schema.Types.Mixed },
  callbackUrl: { type: String },
  cost: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const JobModel = mongoose.models.Job || mongoose.model<JobDocument>('Job', jobSchema);
