import { TenantModel } from '@/features/tenants/tenant.model';
import { CreditLedgerModel } from '@/features/credits/credit.model';
import { httpError } from '@/shared/errors';

async function getBalance(tenantId: string) {
  const tenant = await TenantModel.findById(tenantId).exec();
  if (!tenant) throw httpError(404, 'not_found', 'tenant_not_found');
  return { balance_cents: tenant.balanceCents, plan: tenant.plan };
}

async function topup(tenantId: string, amountCents: number) {
  const tenant = await TenantModel.findById(tenantId).exec();
  if (!tenant) throw httpError(404, 'not_found', 'tenant_not_found');
  tenant.balanceCents += amountCents;
  await tenant.save();
  await CreditLedgerModel.create({ tenantId, deltaCents: amountCents, reason: 'topup' });
  return { balance_cents: tenant.balanceCents };
}

async function deduct(tenantId: string, amountCents: number, reason: string, jobId?: string) {
  const tenant = await TenantModel.findById(tenantId).exec();
  if (!tenant) throw httpError(404, 'not_found', 'tenant_not_found');
  if (tenant.balanceCents < amountCents) throw httpError(403, 'quota_exceeded', 'insufficient_credits');
  tenant.balanceCents -= amountCents;
  await tenant.save();
  await CreditLedgerModel.create({ tenantId, deltaCents: -amountCents, reason, jobId });
}

async function ledger(tenantId: string, limit: number = 50, cursor?: string) {
  const query: any = { tenantId };
  if (cursor) query._id = { $lt: cursor };
  const items = await CreditLedgerModel.find(query).sort({ _id: -1 }).limit(limit).exec();
  const nextCursor = items.length === limit ? items[items.length - 1].id : null;
  return {
    items: items.map(i => ({ id: i.id, delta_cents: i.deltaCents, reason: i.reason, job_id: i.jobId, created_at: i.createdAt })),
    next_cursor: nextCursor,
  };
}

export const creditService = { getBalance, topup, deduct, ledger };

