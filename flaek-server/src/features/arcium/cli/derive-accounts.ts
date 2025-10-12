import 'dotenv/config';
import { PublicKey } from '@solana/web3.js';

async function main() {
  const args = process.argv.slice(2);
  const programIdArg = args[0];
  const circuitName = args[1];
  const compOffsetArg = args[2];
  if (!programIdArg) {
    console.error('Usage: npm run arcium:derive -- <PROGRAM_ID> [CIRCUIT_NAME] [COMPUTATION_OFFSET]');
    process.exit(1);
  }
  const arc = require('@arcium-hq/client');
  const programId = new PublicKey(programIdArg);

  const out: Record<string, any> = { programId: programId.toBase58() };
  if (arc.getMXEAccAddress) out.mxe = arc.getMXEAccAddress(programId);
  if (arc.getMempoolAccAddress) out.mempool = arc.getMempoolAccAddress(programId);
  if (arc.getExecutingPoolAccAddress) out.executingPool = arc.getExecutingPoolAccAddress(programId);

  let compDefOffset: number | undefined;
  if (circuitName && arc.getCompDefAccOffset) {
    compDefOffset = arc.getCompDefAccOffset(circuitName);
    out.compDefOffset = compDefOffset;
  }
  if (arc.getCompDefAccAddress && (compDefOffset !== undefined)) {
    out.compDef = arc.getCompDefAccAddress(programId, compDefOffset);
  }

  const compOffset = compOffsetArg ? parseInt(compOffsetArg, 10) : undefined;
  if (compOffset !== undefined && arc.getComputationAccAddress) {
    out.computation = arc.getComputationAccAddress(programId, compOffset);
  }

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });

