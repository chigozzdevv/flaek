import mongoose, { Schema } from 'mongoose';

export type CreditLedgerDocument = mongoose.Document & {
  tenantId: string;
  deltaCents: number;
  reason: string;
  jobId?: string;
  createdAt: Date;
};

const creditLedgerSchema = new Schema<CreditLedgerDocument>({
  tenantId: { type: String, required: true, index: true },
  deltaCents: { type: Number, required: true },
  reason: { type: String, required: true },
  jobId: { type: String },
}, { timestamps: true });

export const CreditLedgerModel = mongoose.models.CreditLedger || mongoose.model<CreditLedgerDocument>('CreditLedger', creditLedgerSchema);
