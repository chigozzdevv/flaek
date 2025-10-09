import 'dotenv/config';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as arc from '@arcium-hq/client';

type GetMXE = (provider: anchor.Provider, mxeProgramId: PublicKey) => Promise<Uint8Array>;

async function main() {
  const rpc = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpc, 'confirmed');

  const secret = process.env.ARCIUM_SOLANA_SECRET_KEY;
  const kp = secret ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret))) : Keypair.generate();
  const wallet = new anchor.Wallet(kp);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  anchor.setProvider(provider);

  const mxeProgramId = arc.getArciumProgramId();

  const withRetry = (arc as any).getMXEPublicKeyWithRetry as GetMXE | undefined;
  const getMXE: GetMXE = withRetry ?? (arc.getMXEPublicKey as GetMXE);

  const mxe = await getMXE(provider, mxeProgramId);
  const b64 = Buffer.from(mxe).toString('base64');
  const hex = Buffer.from(mxe).toString('hex');

  console.log(JSON.stringify({
    mxeProgramId: mxeProgramId.toBase58(),
    mxePublicKey: { base64: b64, hex }
  }, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });