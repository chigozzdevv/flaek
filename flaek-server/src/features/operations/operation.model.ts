import mongoose, { Schema } from 'mongoose';

export type OperationDocument = mongoose.Document & {
  tenantId: string;
  name: string;
  version: string;
  pipelineSpec: any;
  pipelineHash: string;
  artifactUri: string;
  runtime: 'container' | 'wasm' | 'arcium';
  inputs: string[];
  outputs: string[];
  status: 'active' | 'deprecated';
  mxeProgramId: string;
  compDefOffset?: number;
  programId?: string;
  method?: string;
  accounts?: any;
  createdAt: Date;
  updatedAt: Date;
};

const operationSchema = new Schema<any>({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  version: { type: String, required: true },
  pipelineSpec: { type: Schema.Types.Mixed, required: true },
  pipelineHash: { type: String, required: true, index: true },
  artifactUri: { type: String, required: true },
  runtime: { type: String, enum: ['container', 'wasm', 'arcium'], default: 'arcium' },
  inputs: { type: [String], default: [] },
  outputs: { type: [String], default: [] },
  status: { type: String, enum: ['active', 'deprecated'], default: 'active' },
  mxeProgramId: { type: String, required: true },
  compDefOffset: { type: Number },
  programId: { type: String },
  method: { type: String },
  accounts: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const OperationModel = mongoose.models.Operation || mongoose.model<OperationDocument>('Operation', operationSchema);
