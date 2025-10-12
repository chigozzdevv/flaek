import mongoose, { Schema } from 'mongoose';

export type WebhookDocument = mongoose.Document & {
  tenantId: string;
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const webhookSchema = new Schema<any>({
  tenantId: { type: String, required: true, index: true },
  url: { type: String, required: true },
  events: { type: [String], default: ['job.completed', 'job.failed'] },
  secret: { type: String },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

export const WebhookModel = mongoose.models.Webhook || mongoose.model<WebhookDocument>('Webhook', webhookSchema);
