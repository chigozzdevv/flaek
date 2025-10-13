import { Request, Response } from 'express';
import { webhookService } from './webhook.service';

async function create(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const webhook = await webhookService.createWebhook(tenantId, req.body);
  res.status(201).json(webhook);
}

async function list(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const webhooks = await webhookService.listWebhooks(tenantId);
  res.json({ items: webhooks });
}

async function get(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const { webhookId } = req.params;
  const webhook = await webhookService.getWebhook(tenantId, webhookId);
  if (!webhook) {
    return res.status(404).json({ code: 'not_found', message: 'Webhook not found' });
  }
  res.json(webhook);
}

async function update(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const { webhookId } = req.params;
  const webhook = await webhookService.updateWebhook(tenantId, webhookId, req.body);
  if (!webhook) {
    return res.status(404).json({ code: 'not_found', message: 'Webhook not found' });
  }
  res.json(webhook);
}

async function remove(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const { webhookId } = req.params;
  const webhook = await webhookService.deleteWebhook(tenantId, webhookId);
  if (!webhook) {
    return res.status(404).json({ code: 'not_found', message: 'Webhook not found' });
  }
  res.status(204).send();
}

function test(_req: Request, res: Response) {
  res.json({ delivered: true });
}

export const webhookController = {
  create,
  list,
  get,
  update,
  remove,
  test
};

