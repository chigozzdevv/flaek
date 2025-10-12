import 'dotenv/config';
import * as fs from 'fs';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { uploadCircuit } from '@arcium-hq/client';

async function main() {
  const [mxeProgramIdArg, circuitName, circuitPath] = process.argv.slice(2);
  if (!mxeProgramIdArg || !circuitName || !circuitPath) {
    console.error('Usage: npm run arcium:upload -- <MXE_PROGRAM_ID> <CIRCUIT_NAME> <CIRCUIT_FILE.arcis>');
    process.exit(1);
  }

  const rpc = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpc, 'confirmed');

  const secret = process.env.ARCIUM_SOLANA_SECRET_KEY;
  if (!secret) throw new Error('ARCIUM_SOLANA_SECRET_KEY not set');
  const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
  const wallet = new anchor.Wallet(kp);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  anchor.setProvider(provider);

  const mxeProgramId = new PublicKey(mxeProgramIdArg);
  const bytes = fs.readFileSync(circuitPath);
  const sigs = await uploadCircuit(provider as any, circuitName, mxeProgramId, new Uint8Array(bytes), true);
  console.log(JSON.stringify({ uploaded: true, txs: sigs }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });

