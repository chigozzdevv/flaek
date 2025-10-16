import { Request, Response } from 'express';
import { TenantModel } from '@/features/tenants/tenant.model';
import { Connection, PublicKey } from '@solana/web3.js';
import { getMXEPublicKey } from '@arcium-hq/client';

async function getTenantPublic(req: Request, res: Response) {
  const { tenantId } = req.params;
  const tenant = await TenantModel.findById(tenantId).exec();
  if (!tenant) return res.status(404).json({ code: 'not_found', message: 'tenant_not_found' });
  res.json({ publishable_key: tenant.publishableKey, tenant_public_key: tenant.tenantPublicKey, embed_js: 'https://cdn.flaek.dev/embed.min.js' });
}

export const publicController = { getTenantPublic, getMxePublicKey };
async function getMxePublicKey(req: Request, res: Response) {
  try {
    const { programId } = req.params;
    if (!programId) return res.status(400).json({ code: 'invalid_request', message: 'programId required' });
    const rpc = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(rpc, 'confirmed');
    const provider = { connection } as any;
    const mxePk = new PublicKey(programId);
    const mxePublicKey = await getMXEPublicKey(provider, mxePk);
    if (!mxePublicKey) return res.status(404).json({ code: 'not_found', message: 'mxe_public_key_not_found' });
    return res.json({ public_key: Array.from(mxePublicKey) });
  } catch (e: any) {
    return res.status(500).json({ code: 'server_error', message: e.message || 'failed_to_get_mxe_public_key' });
  }
}
