import { WebhookModel } from './webhook.model';

async function create(tenantId: string, data: { url: string; events?: string[]; secret?: string }) {
  const webhook = await WebhookModel.create({
    tenantId,
    url: data.url,
    events: data.events || ['job.completed', 'job.failed'],
    secret: data.secret,
    enabled: true,
  });
  return webhook;
}

async function list(tenantId: string) {
  return WebhookModel.find({ tenantId }).exec();
}

async function get(tenantId: string, webhookId: string) {
  return WebhookModel.findOne({ _id: webhookId, tenantId }).exec();
}

async function update(tenantId: string, webhookId: string, data: { url?: string; events?: string[]; secret?: string; enabled?: boolean }) {
  return WebhookModel.findOneAndUpdate(
    { _id: webhookId, tenantId },
    { $set: data },
    { new: true }
  ).exec();
}

async function remove(tenantId: string, webhookId: string) {
  return WebhookModel.findOneAndDelete({ _id: webhookId, tenantId }).exec();
}

async function findActiveByTenant(tenantId: string) {
  return WebhookModel.find({ tenantId, enabled: true }).exec();
}

export const webhookRepository = {
  create,
  list,
  get,
  update,
  remove,
  findActiveByTenant,
};
