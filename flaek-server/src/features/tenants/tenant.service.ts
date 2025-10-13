import { tenantRepository } from '@/features/tenants/tenant.repository';
import { newId } from '@/utils/id';
import { randomBytes } from '@/utils/crypto';
import { httpError } from '@/shared/errors';

function genApiKey(): { keyId: string; apiKey: string; prefix: string } {
  const keyId = newId('key');
  const prefix = 'sk';
  const body = randomBytes(24).toString('base64url');
  const apiKey = `${prefix}_${body}`;
  return { keyId, apiKey, prefix };
}

function genPublishable(): { publishableKey: string; tenantPublicKey: string } {
  const pk = `pk_${randomBytes(18).toString('base64url')}`;
  const tenantPublicKey = randomBytes(32).toString('base64');
  return { publishableKey: pk, tenantPublicKey };
}

async function me(ownerUserId: string) {
  const tenant = await tenantRepository.ensureForOwner(ownerUserId, 'My Organization');
  return {
    tenant_id: tenant.id,
    org_name: tenant.name,
    created_at: tenant.createdAt,
    balance_cents: tenant.balanceCents || 0,
    plan: tenant.plan || 'free',
    keys: tenant.apiKeys.map((k: any) => ({ key_id: k.keyId, name: k.name, created_at: k.createdAt, revoked_at: k.revokedAt })),
  };
}

async function createKey(ownerUserId: string, name?: string) {
  const tenant = await tenantRepository.ensureForOwner(ownerUserId, 'My Organization');
  const { keyId, apiKey, prefix } = genApiKey();
  await tenantRepository.createApiKey(tenant, keyId, name, apiKey, prefix);
  return { api_key: apiKey, key_id: keyId };
}

async function revokeKey(ownerUserId: string, keyId: string) {
  const tenant = await tenantRepository.findByOwnerUserId(ownerUserId);
  if (!tenant) throw httpError(404, 'not_found', 'tenant_not_found');
  await tenantRepository.revokeApiKey(tenant.id, keyId);
}

async function createPublishable(ownerUserId: string) {
  const { publishableKey, tenantPublicKey } = genPublishable();
  const t = await tenantRepository.rotatePublishable(ownerUserId, publishableKey, tenantPublicKey);
  return { publishable_key: t.publishableKey, tenant_public_key: t.tenantPublicKey };
}

export const tenantService = { me, createKey, revokeKey, createPublishable };
