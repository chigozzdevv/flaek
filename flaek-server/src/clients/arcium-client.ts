import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { x25519, RescueCipher, getMXEPublicKey, deserializeLE, getArciumProgram, getArciumProgramId, getComputationAccAddress, getMempoolAccAddress, getExecutingPoolAccAddress, getCompDefAccAddress, getStakingPoolAccAddress, getClockAccAddress, getMXEAccAddress } from '@arcium-hq/client';
import crypto from 'crypto';

export type ArciumJobRequest = {
  programId: string;
  mxeProgramId: string;
  idl: any;
  method: string;
  accounts?: Record<string, string>;
  payload: Buffer;
};

export class ArciumClient {
  private provider: anchor.AnchorProvider;

  constructor() {
    const rpc = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpc, 'confirmed');
    const secret = process.env.ARCIUM_SOLANA_SECRET_KEY;
    if (!secret) throw new Error('ARCIUM_SOLANA_SECRET_KEY not set');
    const secretArr = JSON.parse(secret);
    const kp = Keypair.fromSecretKey(Uint8Array.from(secretArr));
    const wallet = new anchor.Wallet(kp);
    this.provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    anchor.setProvider(this.provider);
  }

  async submit(req: ArciumJobRequest): Promise<{ tx: string; computationOffset: string; nonceB64: string; clientPubKeyB64: string }> {
    const programId = new PublicKey(req.programId);
    const mxeProgramId = new PublicKey(req.mxeProgramId);
    const program = new (anchor as any).Program(req.idl as any, programId, this.provider);

    const mxePublicKey = await getMXEPublicKey(this.provider as any, mxeProgramId);
    if (!mxePublicKey) throw new Error('MXE public key not set for the given MXE program');

    const priv = x25519.utils.randomSecretKey();
    const pub = x25519.getPublicKey(priv);
    const shared = x25519.getSharedSecret(priv, mxePublicKey);
    const cipher = new RescueCipher(shared);
    const nonce = crypto.randomBytes(16);

    const bytes = new Uint8Array(req.payload);
    const limbs: bigint[] = [];
    for (let i = 0; i < bytes.length; i += 32) {
      const slice = bytes.slice(i, Math.min(i + 32, bytes.length));
      if (slice.length === 32) {
        limbs.push(deserializeLE(slice));
      } else {
        const padded = new Uint8Array(32);
        padded.set(slice, 0);
        limbs.push(deserializeLE(padded));
      }
    }

    const ct = cipher.encrypt(limbs, nonce);

    const method = (program.methods as any)[req.method];
    if (!method) throw new Error(`Method ${req.method} not found in program`);

    const computationOffset = new (anchor as any).BN(crypto.randomBytes(8).toString('hex'), 16);
    const nonceBn = new (anchor as any).BN(deserializeLE(nonce).toString());

    const tx = await method(
      computationOffset,
      Array.from(ct[0] as unknown as Uint8Array),
      Array.from(ct[1] as unknown as Uint8Array),
      Array.from(pub),
      nonceBn
    )
      .accountsPartial(req.accounts || {})
      .rpc({ commitment: 'finalized' });

    return { tx, computationOffset: computationOffset.toString(), nonceB64: Buffer.from(nonce).toString('base64'), clientPubKeyB64: Buffer.from(pub).toString('base64') };
  }

  async submitQueue(input: { mxeProgramId: string; payload: Buffer; compDefOffset: number; circuit: string; accounts?: Record<string, string> }): Promise<{ tx: string; computationOffset: string; nonceB64: string; clientPubKeyB64: string; clientPrivB64: string }> {
    const mxeProgramId = new PublicKey(input.mxeProgramId);
    const provider = this.provider;
    
    // Load MXE program IDL - use process.cwd() to get project root
    const path = require('path');
    const fs = require('fs');
    const idlPath = path.join(process.cwd(), 'flaek_mxe/target/idl/flaek_mxe.json');
    console.log('[Arcium Client] Loading IDL from:', idlPath);
    
    if (!fs.existsSync(idlPath)) {
      throw new Error(`IDL file not found at: ${idlPath}`);
    }
    
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
    console.log('[Arcium Client] IDL loaded, program name:', idl.metadata?.name);
    const mxeProgram = new (anchor as any).Program(idl, mxeProgramId, provider);

    console.log('[Arcium Client] Getting MXE public key for:', mxeProgramId.toBase58());
    let mxePublicKey: Uint8Array | null = null;
    let retries = 3;
    while (retries > 0 && !mxePublicKey) {
      try {
        mxePublicKey = await getMXEPublicKey(provider as any, mxeProgramId);
        if (mxePublicKey) break;
      } catch (err: any) {
        retries--;
        if (retries > 0) {
          console.log(`[Arcium Client] Failed to get MXE public key (${err.message}), retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw new Error(`Failed to get MXE public key after 3 attempts: ${err.message}`);
        }
      }
    }
    if (!mxePublicKey) throw new Error('MXE public key not set for the given MXE program');
    console.log('[Arcium Client] MXE public key retrieved');

    const priv = x25519.utils.randomSecretKey();
    const pub = x25519.getPublicKey(priv);
    const shared = x25519.getSharedSecret(priv, mxePublicKey);
    const cipher = new RescueCipher(shared);
    const nonce = crypto.randomBytes(16);

    const bytes = new Uint8Array(input.payload);
    const limbs: bigint[] = [];
    for (let i = 0; i < bytes.length; i += 32) {
      const slice = bytes.slice(i, Math.min(i + 32, bytes.length));
      const padded = new Uint8Array(32);
      padded.set(slice, 0);
      limbs.push(deserializeLE(padded));
    }
    const ct = cipher.encrypt(limbs, nonce);

    const compOffset = new (anchor as any).BN(crypto.randomBytes(8).toString('hex'), 16);
    const compAcc = getComputationAccAddress(mxeProgramId, compOffset);
    const mxeAcc = getMXEAccAddress(mxeProgramId);
    const mempool = getMempoolAccAddress(mxeProgramId);
    const executingPool = getExecutingPoolAccAddress(mxeProgramId);
    const compDef = getCompDefAccAddress(mxeProgramId, input.compDefOffset);
    const clusterOverride = input.accounts?.cluster ?? input.accounts?.clusterAccount ?? process.env.ARCIUM_CLUSTER_PUBKEY;
    if (!clusterOverride) {
      throw new Error('Cluster account not provided. Set accounts.cluster or ARCIUM_CLUSTER_PUBKEY.');
    }
    const cluster = new PublicKey(clusterOverride);
    const poolAccount = getStakingPoolAccAddress();
    const clock = getClockAccAddress();

    const signSeed = PublicKey.findProgramAddressSync([Buffer.from('SignerAccount')], getArciumProgramId());

    // Call the MXE program method directly (like the docs example)
    const method = (mxeProgram.methods as any)[input.circuit];
    if (!method) throw new Error(`Method ${input.circuit} not found in MXE program`);
    
    console.log('[Arcium Client] Calling MXE program method:', input.circuit);
    
    // Build the required accounts as per Arcium docs
    const accounts = {
      computationAccount: compAcc,
      clusterAccount: cluster,
      mxeAccount: mxeAcc,
      mempoolAccount: mempool,
      executingPool,
      compDefAccount: compDef,
      ...input.accounts, // Merge any additional accounts
    };
    
    console.log('[Arcium Client] Accounts:', Object.keys(accounts));
    
    const tx = await method(
      compOffset,
      Array.from(ct[0]),
      Array.from(ct[1]),
      Array.from(pub),
      new (anchor as any).BN(deserializeLE(nonce).toString())
    )
      .accountsPartial(accounts)
      .rpc({ commitment: 'finalized' });

    return { tx, computationOffset: compOffset.toString(), nonceB64: Buffer.from(nonce).toString('base64'), clientPubKeyB64: Buffer.from(pub).toString('base64'), clientPrivB64: Buffer.from(priv).toString('base64') };
  }
}
