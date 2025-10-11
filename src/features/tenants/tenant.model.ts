import mongoose, { Schema } from 'mongoose';

export type ApiKeyDoc = {
  keyId: string;
  name?: string;
  hash: string;
  prefix: string;
  createdAt: Date;
  revokedAt?: Date;
};

export type TenantDocument = mongoose.Document & {
  name: string;
  ownerUserId: string;
  publishableKey?: string;
  tenantPublicKey?: string;
  apiKeys: ApiKeyDoc[];
  balanceCents: number;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
};

const apiKeySchema = new Schema<ApiKeyDoc>({
  keyId: { type: String, required: true },
  name: { type: String },
  hash: { type: String, required: true, index: true },
  prefix: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
  revokedAt: { type: Date },
});

const tenantSchema = new Schema<TenantDocument>({
  name: { type: String, required: true },
  ownerUserId: { type: String, required: true, index: true },
  publishableKey: { type: String, index: true },
  tenantPublicKey: { type: String },
  apiKeys: { type: [apiKeySchema], default: [] },
  balanceCents: { type: Number, default: 100000 },
  plan: { type: String, default: 'free' },
}, { timestamps: true });

export const TenantModel = mongoose.models.Tenant || mongoose.model<TenantDocument>('Tenant', tenantSchema);

