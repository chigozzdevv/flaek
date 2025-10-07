import 'dotenv/config';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

async function main() {
  const programIdArg = process.argv[2];
  if (!programIdArg) {
    console.error('Usage: npm run arcium:mxe -- <PROGRAM_ID>');
    process.exit(1);
  }

  const rpc = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpc, 'confirmed');
  const secret = process.env.ARCIUM_SOLANA_SECRET_KEY;
  const kp = secret ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret))) : Keypair.generate();
  const wallet = new anchor.Wallet(kp);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  anchor.setProvider(provider);

  const programId = new PublicKey(programIdArg);
  const arc = require('@arcium-hq/client');
  const fn = arc.getMXEPublicKeyWithRetry || arc.getMXEPublicKey;
  if (!fn) throw new Error('getMXEPublicKey not available in @arcium-hq/client');
  const mxe: Uint8Array = await fn(provider, programId);
  const b64 = Buffer.from(mxe).toString('base64');
  const hex = Buffer.from(mxe).toString('hex');
  console.log(JSON.stringify({ programId: programId.toBase58(), mxePublicKey: { base64: b64, hex } }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
