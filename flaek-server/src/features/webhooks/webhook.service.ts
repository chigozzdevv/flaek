import { webhookRepository } from './webhook.repository';

async function createWebhook(tenantId: string, data: { url: string; events?: string[]; secret?: string }) {
  return webhookRepository.create(tenantId, data);
}

async function listWebhooks(tenantId: string) {
  return webhookRepository.list(tenantId);
}

async function getWebhook(tenantId: string, webhookId: string) {
  return webhookRepository.get(tenantId, webhookId);
}

async function updateWebhook(tenantId: string, webhookId: string, data: { url?: string; events?: string[]; secret?: string; enabled?: boolean }) {
  return webhookRepository.update(tenantId, webhookId, data);
}

async function deleteWebhook(tenantId: string, webhookId: string) {
  return webhookRepository.remove(tenantId, webhookId);
}

export const webhookService = {
  createWebhook,
  listWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
};

