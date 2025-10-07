import 'dotenv/config';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

async function main() {
  const programIdArg = process.argv[2];
  if (!programIdArg) {
    console.error('Usage: npm run arcium:idl -- <PROGRAM_ID>');
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

  const idl = await (anchor as any).Program.fetchIdl?.(programId, provider);
  if (!idl) {
    console.error('IDL not found on-chain for programId');
    process.exit(2);
  }
  console.log(JSON.stringify(idl, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
