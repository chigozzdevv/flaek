import { Response } from 'express';

const clients = new Map<string, Set<Response>>();

export function addSSEClient(tenantId: string, res: Response) {
  if (!clients.has(tenantId)) {
    clients.set(tenantId, new Set());
  }
  clients.get(tenantId)!.add(res);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // Remove client on disconnect
  res.on('close', () => {
    const tenantClients = clients.get(tenantId);
    if (tenantClients) {
      tenantClients.delete(res);
      if (tenantClients.size === 0) {
        clients.delete(tenantId);
      }
    }
  });
}

export function broadcastJobUpdate(tenantId: string, jobUpdate: any) {
  const tenantClients = clients.get(tenantId);
  if (!tenantClients) return;

  const message = `data: ${JSON.stringify(jobUpdate)}\n\n`;
  
  tenantClients.forEach((client) => {
    try {
      client.write(message);
    } catch (error) {
      console.error('Failed to send SSE message:', error);
      tenantClients.delete(client);
    }
  });
}
