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

  async submitQueue(input: { mxeProgramId: string; payload: Buffer; compDefOffset: number; circuit: string; accounts?: Record<string, string>; clientPublicKey?: Buffer; clientNonce?: Buffer }): Promise<{ tx: string; computationOffset: string; nonceB64: string; clientPubKeyB64: string; clientPrivB64: string }> {
    try {
      console.log('[Arcium Client] submitQueue called with:', {
        mxeProgramId: input.mxeProgramId,
        payloadLength: input.payload.length,
        compDefOffset: input.compDefOffset,
        circuit: input.circuit,
        accounts: input.accounts
      });

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

    console.log('[Arcium Client] Creating MXE program...');
    const mxeProgram = new (anchor as any).Program(idl, provider);
    console.log('[Arcium Client] MXE program created');

    console.log('[Arcium Client] Getting MXE public key for:', mxeProgramId.toBase58());
    let mxePublicKey: Uint8Array | null = null;
    const maxRetries = 10;
    const retryDelayMs = 500;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Arcium Client] Calling getMXEPublicKey (attempt ${attempt}/${maxRetries})...`);
        mxePublicKey = await getMXEPublicKey(provider as any, mxeProgramId);
        if (mxePublicKey) {
          console.log('[Arcium Client] getMXEPublicKey returned:', `${mxePublicKey.length} bytes`);
          break;
        }
      } catch (err: any) {
        console.error(`[Arcium Client] Attempt ${attempt} failed to get MXE public key:`, err.message);
        if (attempt < maxRetries) {
          console.log(`[Arcium Client] Retrying in ${retryDelayMs}ms... (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        } else {
          throw new Error(`Failed to get MXE public key after ${maxRetries} attempts: ${err.message}`);
        }
      }
    }

    if (!mxePublicKey) {
      throw new Error('MXE public key not set for the given MXE program');
    }
    console.log('[Arcium Client] MXE public key retrieved successfully');

    let priv: Uint8Array;
    let pub: Uint8Array;
    let nonce: Buffer;
    let ct0: any, ct1: any;

    if (input.clientPublicKey && input.clientNonce) {
      console.log('[Arcium Client] Using client-provided encryption (confidential computing mode)');
      pub = new Uint8Array(input.clientPublicKey);
      nonce = input.clientNonce;
      priv = new Uint8Array(32);

      const bytes = new Uint8Array(input.payload);
      if (bytes.length < 64) {
        throw new Error('Client-encrypted payload too short (expected at least 64 bytes for ct0+ct1)');
      }
      ct0 = bytes.slice(0, bytes.length / 2);
      ct1 = bytes.slice(bytes.length / 2);
      console.log('[Arcium Client] Client-encrypted ct0/ct1 extracted');
    } else {
      console.log('[Arcium Client] Using server-side encryption (legacy mode)');
      priv = x25519.utils.randomSecretKey();
      pub = x25519.getPublicKey(priv);
      const shared = x25519.getSharedSecret(priv, mxePublicKey);
      const cipher = new RescueCipher(shared);
      nonce = crypto.randomBytes(16);

      const bytes = new Uint8Array(input.payload);
      console.log('[Arcium Client] Payload bytes length:', bytes.length);

      const limbs: bigint[] = [];
      for (let i = 0; i < bytes.length; i += 32) {
        const slice = bytes.slice(i, Math.min(i + 32, bytes.length));
        const padded = new Uint8Array(32);
        padded.set(slice, 0);
        limbs.push(deserializeLE(padded));
      }

      console.log('[Arcium Client] Limbs to encrypt:', limbs.length, 'limbs');
      console.log('[Arcium Client] Nonce:', nonce.length, 'bytes');

      if (limbs.length === 0) {
        throw new Error('No limbs to encrypt - payload is empty');
      }

      const ct = cipher.encrypt(limbs, nonce);
      console.log('[Arcium Client] Ciphertext result type:', typeof ct);
      console.log('[Arcium Client] Ciphertext result:', ct);

      if (Array.isArray(ct) && ct.length >= 2) {
        ct0 = ct[0];
        ct1 = ct[1];
      } else if (ct && typeof ct === 'object' && 'ct0' in ct && 'ct1' in ct) {
        ct0 = (ct as any).ct0;
        ct1 = (ct as any).ct1;
      } else if (ct && typeof ct === 'object' && 'parts' in ct) {
        const parts = (ct as any).parts;
        if (Array.isArray(parts) && parts.length >= 2) {
          ct0 = parts[0];
          ct1 = parts[1];
        }
      }

      if (!ct0 || !ct1) {
        throw new Error(`Encryption failed: could not extract ciphertext parts. Got: ${JSON.stringify(ct)}`);
      }

      console.log('[Arcium Client] Extracted ct0:', ct0);
      console.log('[Arcium Client] Extracted ct1:', ct1);
    }

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

    const method = (mxeProgram.methods as any)[input.circuit];
    if (!method) throw new Error(`Method ${input.circuit} not found in MXE program`);
    
    console.log('[Arcium Client] Calling MXE program method:', input.circuit);
    
    const accounts = {
      computationAccount: compAcc,
      clusterAccount: cluster,
      mxeAccount: mxeAcc,
      mempoolAccount: mempool,
      executingPool,
      compDefAccount: compDef,
      stakingPoolAccount: poolAccount,
      clockAccount: clock,
      signerAccount: signSeed[0],
      arciumProgram: getArciumProgramId(),
      ...input.accounts, // Merge any additional accounts
    };

    console.log('[Arcium Client] Accounts:', accounts);
    console.log('[Arcium Client] Preparing method call with:');
    console.log('  - compOffset:', compOffset.toString());
    console.log('  - ct0 type:', typeof ct0, 'length:', ct0?.length);
    console.log('  - ct1 type:', typeof ct1, 'length:', ct1?.length);
    console.log('  - pub length:', pub.length);

    try {
      console.log('[Arcium Client] Fetching latest blockhash...');
      const { blockhash } = await provider.connection.getLatestBlockhash('confirmed');
      console.log('[Arcium Client] Latest blockhash:', blockhash);

      const tx = await method(
        compOffset,
        Array.from(ct0 as unknown as Uint8Array),
        Array.from(ct1 as unknown as Uint8Array),
        Array.from(pub),
        new (anchor as any).BN(deserializeLE(nonce).toString())
      )
        .accountsPartial(accounts)
        .rpc({
          skipPreflight: true,
          commitment: 'confirmed'
        });

      return { tx, computationOffset: compOffset.toString(), nonceB64: Buffer.from(nonce).toString('base64'), clientPubKeyB64: Buffer.from(pub).toString('base64'), clientPrivB64: Buffer.from(priv).toString('base64') };
    } catch (error: any) {
      console.error('[Arcium Client] Method call failed:', error.message);
      console.error('[Arcium Client] Error stack:', error.stack);
      throw error;
    }
    } catch (error: any) {
      console.error('[Arcium Client] submitQueue failed:', error.message);
      console.error('[Arcium Client] Full stack:', error.stack);
      throw error;
    }
  }
}
