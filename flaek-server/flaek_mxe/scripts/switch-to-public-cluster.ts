import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import dotenv from 'dotenv';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import {
  getClusterAccAddress,
  getMXEAccAddress,
  getArciumProgramId,
  getArciumProgAddress,
  getArciumAccountBaseSeed,
  getCompDefAccOffset,
  buildFinalizeCompDefTx,
} from '@arcium-hq/client';

type Args = {
  clusterOffset: number;
  rpcUrl: string;
  walletPath: string;
  programId?: string;
  programKeypair?: string;
  createNewProgram: boolean;
  yes: boolean;
  skipDb: boolean;
};

const CIRCUITS = [
  'add', 'subtract', 'multiply', 'divide', 'modulo', 'power', 'abs_diff',
  'greater_than', 'less_than', 'equal', 'greater_equal', 'less_equal', 'in_range',
  'and', 'or', 'not', 'xor', 'if_else',
  'average', 'sum', 'min', 'max', 'median',
  'credit_score', 'health_risk', 'vote_tally', 'meets_threshold', 'weighted_average'
];

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (k: string) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const has = (k: string) => argv.includes(k);

  // Load .env from project root (flaek-server/.env)
  dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

  const clusterOffset = Number(get('--cluster-offset') || process.env.ARCIUM_CLUSTER_OFFSET || 1078779259);
  const rpcUrl = get('--rpc') || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const walletPath = get('--wallet') || path.join(os.homedir(), '.config/solana/id.json');
  const programId = get('--program-id');
  const programKeypair = get('--program-keypair');
  const createNewProgram = has('--create-new-program');
  const yes = has('--yes') || has('-y');
  const skipDb = has('--skip-db');
  return { clusterOffset, rpcUrl, walletPath, programId, programKeypair, createNewProgram, yes, skipDb };
}

function readKpJson(file: string): Keypair {
  const raw = fs.readFileSync(file, 'utf-8');
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
}

async function confirmOrExit(yes: boolean) {
  if (yes) return;
  const rl = await import('readline/promises');
  const rli = rl.createInterface({ input: process.stdin, output: process.stdout });
  const ans = await rli.question('WARNING: This will re-initialize your MXE and (re)initialize all circuits. Continue? (yes/no): ');
  rli.close();
  if (ans.trim() !== 'yes') {
    console.log('Aborted.');
    process.exit(0);
  }
}

async function ensureInitMxe(
  provider: anchor.AnchorProvider,
  programId: PublicKey,
  clusterOffset: number,
  wallet: Keypair,
  rpcUrl: string,
  walletPath: string,
) {
  const idlPath = path.join(__dirname, '..', 'target', 'idl', 'flaek_mxe.json');
  if (!fs.existsSync(idlPath)) throw new Error(`IDL not found at ${idlPath}. Run anchor build first.`);
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  const idlWithAddr = { ...idl, address: programId.toBase58() };
  const program = new (anchor as any).Program(idlWithAddr, provider);

  const mxeAccount = getMXEAccAddress(programId);
  const arciumProgram = getArciumProgramId();

  console.log('Initializing MXE with new cluster...');
  const initFn = (program.methods as any)?.initMxe;
  if (typeof initFn === 'function') {
    try {
      const sig = await initFn(new (anchor as any).BN(clusterOffset))
        .accounts({
          mxeAccount,
          payer: wallet.publicKey,
          arciumProgram,
          systemProgram: SystemProgram.programId,
        })
        .signers([wallet])
        .rpc({ commitment: 'confirmed' });
      console.log('  ✓ MXE initialized:', sig);
      return;
    } catch (e: any) {
      if (e?.message?.toLowerCase().includes('already') || e?.message?.toLowerCase().includes('initialized')) {
        console.log('  ✓ MXE already initialized for a cluster — proceeding');
        return;
      }
      console.log('  initMxe not callable, will try CLI fallback:', e?.message || e);
    }
  } else {
    console.log('  initMxe not present in IDL, trying CLI fallback');
  }

  const { execSync } = await import('node:child_process');
  const cwd = path.join(__dirname, '..');
  const cmd = `arcium deploy --skip-deploy --cluster-offset ${clusterOffset} --keypair-path "${walletPath}" --rpc-url "${rpcUrl}"`;
  try {
    console.log('  running:', cmd);
    const out = execSync(cmd, { cwd, stdio: 'pipe', env: { ...process.env } });
    console.log(out.toString());
    console.log('  ✓ MXE initialized via CLI');
  } catch (e: any) {
    const msg = (e?.stderr?.toString?.() || e?.message || '').toLowerCase();
    if (msg.includes('already in use') || msg.includes('already') || msg.includes('custom program error: 0x0')) {
      console.log('  ✓ MXE already initialized (CLI reported existing account). Proceeding.');
      return;
    }
    console.log('  ✗ CLI fallback failed');
    throw e;
  }
}

async function initAndFinalizeCircuits(
  provider: anchor.AnchorProvider,
  programId: PublicKey,
  wallet: Keypair,
) {
  const idlPath = path.join(__dirname, '..', 'target', 'idl', 'flaek_mxe.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  const idlWithAddr = { ...idl, address: programId.toBase58() };
  const program = new (anchor as any).Program(idlWithAddr, provider);

  console.log('Re-initializing computation definitions...');
  for (const circuitName of CIRCUITS) {
    console.log(`- ${circuitName}`);
    const baseSeed = getArciumAccountBaseSeed('ComputationDefinitionAccount');
    const offsetBytes = getCompDefAccOffset(circuitName);
    const compDefOffset = Buffer.from(offsetBytes).readUInt32LE();
    const compDefPda = PublicKey.findProgramAddressSync(
      [baseSeed, programId.toBuffer(), offsetBytes],
      getArciumProgAddress()
    )[0];

    const accInfo = await provider.connection.getAccountInfo(compDefPda);
    if (accInfo && accInfo.data?.length > 0) {
      console.log('  already exists, skipping init');
    } else {
      const methodName = `init${circuitName.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('')}CompDef`;
      try {
        const sig = await (program.methods as any)[methodName]()
          .accounts({
            compDefAccount: compDefPda,
            payer: wallet.publicKey,
            mxeAccount: getMXEAccAddress(programId),
            arciumProgram: getArciumProgramId(),
            systemProgram: SystemProgram.programId,
          })
          .signers([wallet])
          .rpc({ commitment: 'confirmed' });
        console.log('  init tx:', sig);
      } catch (e: any) {
        console.log('  init failed:', e?.message || e);
        continue;
      }
    }

    try {
      const finalizeTx: any = await buildFinalizeCompDefTx(provider as any, compDefOffset, programId);
      const latest = await provider.connection.getLatestBlockhash('processed');
      if (finalizeTx.message && typeof finalizeTx.message.recentBlockhash === 'string') {
        finalizeTx.message.recentBlockhash = latest.blockhash;
      } else {
        finalizeTx.recentBlockhash = latest.blockhash;
      }
      finalizeTx.sign(wallet);
      const sig = await provider.sendAndConfirm(finalizeTx, [], { commitment: 'processed' });
      console.log('  finalize tx:', sig);
    } catch (e: any) {
      console.log('  finalize failed:', e?.message || e);
    }
  }
}

function updateEnv(clusterOffset: number, clusterPubkey: string) {
  const envPath = path.join(__dirname, '..', '..', '.env');
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  const setLine = (k: string, v: string) => {
    const re = new RegExp(`^${k}=.*$`, 'm');
    if (re.test(content)) content = content.replace(re, `${k}=${v}`);
    else content += (content.endsWith('\n') ? '' : '\n') + `${k}=${v}\n`;
  };
  setLine('ARCIUM_CLUSTER_OFFSET', String(clusterOffset));
  setLine('ARCIUM_CLUSTER_PUBKEY', clusterPubkey);
  if (/^ARCIUM_MXE_PUBLIC_KEY=.*$/m.test(content)) {
    content = content.replace(/^ARCIUM_MXE_PUBLIC_KEY=.*$/m, '');
  }
  fs.writeFileSync(envPath, content);
  console.log('Updated .env with ARCIUM_CLUSTER_OFFSET and ARCIUM_CLUSTER_PUBKEY');
}

function updateEnvProgramId(programId: string) {
  const envPath = path.join(__dirname, '..', '..', '.env');
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  const re = /^ARCIUM_MXE_PROGRAM_ID=.*$/m;
  if (re.test(content)) content = content.replace(re, `ARCIUM_MXE_PROGRAM_ID=${programId}`);
  else content += (content.endsWith('\n') ? '' : '\n') + `ARCIUM_MXE_PROGRAM_ID=${programId}\n`;
  fs.writeFileSync(envPath, content);
  console.log('Updated .env with ARCIUM_MXE_PROGRAM_ID');
}

function updateAnchorToml(programId: string) {
  const file = path.join(__dirname, '..', 'Anchor.toml');
  if (!fs.existsSync(file)) { console.log('Anchor.toml not found, skipping'); return; }
  let content = fs.readFileSync(file, 'utf-8');
  // Replace [programs.devnet]
  content = content.replace(/(\[programs\.devnet\][\s\S]*?flaek_mxe\s*=\s*")[^"]+("\s*)/m, `$1${programId}$2`);
  // Replace [programs.localnet] too (optional)
  content = content.replace(/(\[programs\.localnet\][\s\S]*?flaek_mxe\s*=\s*")[^"]+("\s*)/m, `$1${programId}$2`);
  fs.writeFileSync(file, content);
  console.log('Updated Anchor.toml program id');
}

async function updateDbIfPossible(clusterPubkey: string) {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.log('Skipping DB update (MONGO_URI not set)');
      return;
    }
    const mongoose = require('mongoose');
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    await db.collection('operations').updateMany({}, { $set: { 'accounts.cluster': clusterPubkey } });
    await mongoose.disconnect();
    console.log('Updated operations.accounts.cluster in DB');
  } catch (e: any) {
    console.log('DB update skipped/failed:', e?.message || e);
  }
}

async function main() {
  const args = parseArgs();
  await confirmOrExit(args.yes);

  console.log('Config:');
  console.log('  cluster offset:', args.clusterOffset);
  console.log('  rpc:', args.rpcUrl);
  console.log('  wallet:', args.walletPath);
  if (args.programId) console.log('  programId:', args.programId);
  if (args.programKeypair) console.log('  programKeypair:', args.programKeypair);
  if (args.createNewProgram) console.log('  createNewProgram: true');

  const wallet = readKpJson(args.walletPath);
  const conn = new Connection(args.rpcUrl, 'confirmed');
  const provider = new anchor.AnchorProvider(conn, new anchor.Wallet(wallet), { commitment: 'confirmed' });
  anchor.setProvider(provider);

  const idlPath = path.join(__dirname, '..', 'target', 'idl', 'flaek_mxe.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));

  let programId: PublicKey | null = null;
  // If program keypair is given, compute pubkey (preferred for new program flow)
  if (args.programKeypair && fs.existsSync(args.programKeypair)) {
    const raw = fs.readFileSync(args.programKeypair, 'utf-8');
    const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
    programId = kp.publicKey;
    console.log('Derived program id from keypair:', programId.toBase58());
  }
  if (!programId) {
  const programIdStr = args.programId || idl.address || idl?.metadata?.address || 'BNrnP5CFtszaCymD7rBM776cD62ExLAx4TgpYQJPyvHR';
    programId = new PublicKey(programIdStr);
  }

  const balLamports = await conn.getBalance(wallet.publicKey);
  const balSol = balLamports / 1e9;
  console.log('Wallet balance:', balSol.toFixed(9), 'SOL');
  if (balSol < 0.2) console.log('Warning: low balance; recommend >= 0.2 SOL');

  const clusterPubkey = getClusterAccAddress(args.clusterOffset).toBase58();
  console.log('Cluster pubkey:', clusterPubkey);

  // If creating a new program, deploy it first via CLI and set program id
  if (args.createNewProgram) {
    const { execSync } = await import('node:child_process');
    const cwd = path.join(__dirname, '..');
    if (!args.programKeypair) {
      // generate program keypair in keys/flaek_mxe_program.json
      const keysDir = path.join(cwd, 'keys');
      if (!fs.existsSync(keysDir)) fs.mkdirSync(keysDir, { recursive: true });
      const defaultKp = path.join(keysDir, 'flaek_mxe_program.json');
      console.log('Generating program keypair at', defaultKp);
      execSync(`solana-keygen new --no-bip39-passphrase --outfile "${defaultKp}"`, { stdio: 'inherit' });
      (args as any).programKeypair = defaultKp;
      const raw = fs.readFileSync(defaultKp, 'utf-8');
      const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
      programId = kp.publicKey;
    }
    console.log('Deploying new program to', programId!.toBase58());
    const deployCmd = `arcium deploy --cluster-offset ${args.clusterOffset} --keypair-path "${args.walletPath}" --rpc-url "${args.rpcUrl}" --program-keypair "${args.programKeypair}"`;
    console.log('  running:', deployCmd);
    try {
      execSync(deployCmd, { cwd, stdio: 'inherit', env: { ...process.env } });
    } catch (e) {
      console.error('Deploy failed');
      throw e;
    }
    updateEnvProgramId(programId!.toBase58());
    updateAnchorToml(programId!.toBase58());
  }

  await ensureInitMxe(provider, programId, args.clusterOffset, wallet, args.rpcUrl, args.walletPath);
  await initAndFinalizeCircuits(provider, programId, wallet);
  updateEnv(args.clusterOffset, clusterPubkey);
  if (!args.skipDb) await updateDbIfPossible(clusterPubkey);

  console.log('\nDone. Restart server/workers and test in Playground.');
}

main().catch((e) => {
  console.error('Fatal:', e?.message || e);
  process.exit(1);
});
