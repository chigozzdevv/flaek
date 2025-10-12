import 'dotenv/config';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { buildFinalizeCompDefTx } from '@arcium-hq/client';

async function main() {
  const [mxeProgramIdArg, compDefOffsetArg] = process.argv.slice(2);
  if (!mxeProgramIdArg || !compDefOffsetArg) {
    console.error('Usage: npm run arcium:finalize -- <MXE_PROGRAM_ID> <COMP_DEF_OFFSET>');
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
  const compDefOffset = parseInt(compDefOffsetArg, 10);
  const tx = await buildFinalizeCompDefTx(provider as any, compDefOffset, mxeProgramId);
  const latest = await provider.connection.getLatestBlockhash('finalized');
  tx.recentBlockhash = latest.blockhash;
  tx.lastValidBlockHeight = latest.lastValidBlockHeight;
  tx.sign(kp);
  const sig = await provider.sendAndConfirm(tx, [kp], { commitment: 'finalized' });
  console.log(JSON.stringify({ finalized: true, tx: sig }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });

