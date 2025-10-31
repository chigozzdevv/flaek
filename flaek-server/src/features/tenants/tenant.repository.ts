import { TenantModel, TenantDocument } from '@/features/tenants/tenant.model';
import { sha256Hex } from '@/utils/hash';
import { env } from '@/config/env';

function hashApiKey(raw: string) {
  return sha256Hex(`${raw}:${env.API_KEY_HASH_SALT}`);
}

export const tenantRepository = {
  async findByOwnerUserId(ownerUserId: string) {
    return TenantModel.findOne({ ownerUserId }).exec();
  },
  async getById(id: string) {
    return TenantModel.findById(id).exec();
  },
  async ensureForOwner(ownerUserId: string, name: string) {
    let t = await TenantModel.findOne({ ownerUserId }).exec();
    if (!t) {
      t = new TenantModel({ ownerUserId, name, apiKeys: [] });
      await t.save();
    }
    return t;
  },
  async createApiKey(tenant: TenantDocument, keyId: string, name: string | undefined, rawKey: string, prefix: string) {
    const hash = hashApiKey(rawKey);
    tenant.apiKeys.push({ keyId, name, hash, prefix, createdAt: new Date() });
    await tenant.save();
    return { keyId };
  },
  async revokeApiKey(tenantId: string, keyId: string) {
    return TenantModel.updateOne({ _id: tenantId, 'apiKeys.keyId': keyId }, { $set: { 'apiKeys.$.revokedAt': new Date() } }).exec();
  },
  async findByApiKey(rawKey: string) {
    const hash = hashApiKey(rawKey);
    return TenantModel.findOne({ 'apiKeys.hash': hash, 'apiKeys.revokedAt': { $exists: false } }).exec();
  },
  async rotatePublishable(ownerUserId: string, publishableKey: string, tenantPublicKey: string) {
    const t = await TenantModel.findOneAndUpdate(
      { ownerUserId },
      { publishableKey, tenantPublicKey },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec();
    return t!;
  },
  async findByPublishableKey(publishableKey: string) {
    return TenantModel.findOne({ publishableKey }).exec();
  },
  async updateName(ownerUserId: string, name: string) {
    const t = await TenantModel.findOneAndUpdate(
      { ownerUserId },
      { name },
      { new: true }
    ).exec();
    return t;
  },
};

export const tenantHash = { hashApiKey };

