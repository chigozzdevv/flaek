import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, ComputeBudgetProgram } from '@solana/web3.js';
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
    const rpc = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
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
    // Anchor >=0.28 expects the program address inside the IDL and a provider as the 2nd arg
    const opIdl = { ...(req.idl as any), address: programId.toBase58() };
    const program = new (anchor as any).Program(opIdl, this.provider);

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

  async submitQueue(input: { mxeProgramId: string; payload: Buffer; compDefOffset: number; circuit: string; accounts?: Record<string, string>; clientPublicKey: Buffer; clientNonce: Buffer }): Promise<{ tx: string; computationOffset: string; nonceB64: string; clientPubKeyB64: string }> {
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
    // Ensure IDL contains the correct address and pass provider only (per new Anchor API)
    const idlWithAddr = { ...idl, address: mxeProgramId.toBase58() };
    const mxeProgram = new (anchor as any).Program(idlWithAddr, provider);
    const idlAddr = idl.address || idl?.metadata?.address;
    if (idlAddr && idlAddr !== mxeProgramId.toBase58()) {
      console.warn('[Arcium Client] Warning: IDL program address differs from requested MXE program ID:', { idlAddr, mxeProgramId: mxeProgramId.toBase58() });
    }
    console.log('[Arcium Client] MXE program created');

    // In client-encrypted mode, we don't need to fetch the MXE public key here.
    // The client provides its public key and nonce; we pass encrypted limbs through.
    console.log('[Arcium Client] Skipping MXE public key fetch (client-encrypted mode)');

    // Confidential computing: client MUST provide encrypted data
    if (!input.clientPublicKey || !input.clientNonce) {
      throw new Error('Client-side encryption is required for confidential computing. clientPublicKey and clientNonce are mandatory.');
    }

    console.log('[Arcium Client] Using client-provided encryption (confidential computing mode)');
    const pub = new Uint8Array(input.clientPublicKey);
    const nonce = input.clientNonce;

    const bytes = new Uint8Array(input.payload);
    if (bytes.length < 64) {
      throw new Error('Client-encrypted payload too short (expected at least 64 bytes for ct0+ct1)');
    }
    
    const ct0 = bytes.slice(0, bytes.length / 2);
    const ct1 = bytes.slice(bytes.length / 2);
    console.log('[Arcium Client] Client-encrypted ct0/ct1 extracted');

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
    const clock = getClockAccAddress();

    // PDA for this MXE program's signer account (seed: "SignerAccount")
    const signPda = PublicKey.findProgramAddressSync([Buffer.from('SignerAccount')], mxeProgramId);

    const method = (mxeProgram.methods as any)[input.circuit];
    if (!method) throw new Error(`Method ${input.circuit} not found in MXE program`);
    
    console.log('[Arcium Client] Calling MXE program method:', input.circuit);
    
    const accounts = {
      payer: (provider.wallet as any)?.publicKey,
      signPdaAccount: signPda[0],
      computationAccount: compAcc,
      clusterAccount: cluster,
      mxeAccount: mxeAcc,
      mempoolAccount: mempool,
      executingPool,
      compDefAccount: compDef,
      clockAccount: clock,
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
        .preInstructions([
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
          ComputeBudgetProgram.requestHeapFrame({ bytes: 256 * 1024 }),
        ])
        .rpc({
          skipPreflight: false,
          commitment: 'confirmed'
        });

      return { tx, computationOffset: compOffset.toString(), nonceB64: Buffer.from(nonce).toString('base64'), clientPubKeyB64: Buffer.from(pub).toString('base64') };
    } catch (error: any) {
      console.error('[Arcium Client] Method call failed:', error?.message || 'No message');
      console.error('[Arcium Client] Error stack:', error?.stack || 'No stack');
      console.error('[Arcium Client] Error name:', error?.name);
      console.error('[Arcium Client] Error type:', typeof error);
      console.error('[Arcium Client] Full error:', error);
      if (error?.logs) {
        console.error('[Arcium Client] Transaction logs:', error.logs);
      }
      throw new Error(`Failed to submit transaction: ${error?.message || JSON.stringify(error)}`);
    }
    } catch (error: any) {
      console.error('[Arcium Client] submitQueue failed:', error.message);
      console.error('[Arcium Client] Full stack:', error.stack);
      throw error;
    }
  }
}
