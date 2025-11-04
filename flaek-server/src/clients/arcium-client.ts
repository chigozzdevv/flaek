import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, ComputeBudgetProgram, SystemProgram } from '@solana/web3.js';
import { x25519, RescueCipher, getMXEPublicKey, deserializeLE, getArciumProgram, getArciumProgramId, getComputationAccAddress, getMempoolAccAddress, getExecutingPoolAccAddress, getCompDefAccAddress, getStakingPoolAccAddress, getClockAccAddress, getMXEAccAddress } from '@arcium-hq/client';
import crypto from 'crypto';

const DEFAULT_HEAP_FRAME_BYTES = 262_144;

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

  async submitQueue(input: { mxeProgramId: string; compDefOffset: number; circuit: string; accounts?: Record<string, string>; clientPublicKey: Buffer; clientNonce: Buffer; ciphertexts?: Array<number[] | Uint8Array>; payload?: Buffer }): Promise<{ tx: string; computationOffset: string; nonceB64: string; clientPubKeyB64: string }> {
    try {
      console.log('[Arcium Client] submitQueue called with:', {
        mxeProgramId: input.mxeProgramId,
        payloadLength: input.payload ? input.payload.length : undefined,
        ciphertexts: input.ciphertexts ? input.ciphertexts.length : undefined,
        compDefOffset: input.compDefOffset,
        circuit: input.circuit,
        accounts: input.accounts
      });

      const mxeProgramId = new PublicKey(input.mxeProgramId);
      const provider = this.provider;

    const path = require('path');
    const fs = require('fs');
    const idlPath = path.join(process.cwd(), '..', 'flaek_mxe', 'target', 'idl', 'flaek_mxe.json');
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

    
    console.log('[Arcium Client] Skipping MXE public key fetch (client-encrypted mode)');

    // Confidential computing: client MUST provide encrypted data
    if (!input.clientPublicKey || !input.clientNonce) {
      throw new Error('Client-side encryption is required for confidential computing. clientPublicKey and clientNonce are mandatory.');
    }

    console.log('[Arcium Client] Using client-provided encryption (confidential computing mode)');
    const pub = new Uint8Array(input.clientPublicKey);
    const nonce = input.clientNonce;

    const cts: Uint8Array[] = [];
    if (input.ciphertexts && Array.isArray(input.ciphertexts)) {
      for (const item of input.ciphertexts) {
        const arr = item instanceof Uint8Array ? item : Uint8Array.from(item as number[]);
        if (arr.length !== 32) throw new Error('Each ciphertext must be 32 bytes');
        cts.push(arr);
      }
    } else if (input.payload) {
      const bytes = new Uint8Array(input.payload);
      if (bytes.length % 32 !== 0) throw new Error('Payload length must be a multiple of 32');
      for (let i = 0; i < bytes.length; i += 32) cts.push(bytes.slice(i, i + 32));
    } else {
      throw new Error('Provide ciphertexts[] or payload');
    }
    console.log('[Arcium Client] Ciphertexts:', cts.length);
    console.log('[Arcium Client] Ciphertext byte lengths:', cts.map((ct) => ct.length));

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
    console.log('[Arcium Client] Derived PDA addresses:', {
      signPda: signPda[0].toBase58(),
      computationAccount: compAcc.toBase58(),
      mempool: mempool.toBase58(),
      executingPool: executingPool.toBase58(),
      compDef: compDef.toBase58(),
      mxeAccount: mxeAcc.toBase58(),
      cluster: cluster.toBase58(),
      clock: clock.toBase58(),
    });

    // Pre-initialize the SignerAccount PDA once to avoid runtime allocation during queue_computation
    try {
      const signInfo = await provider.connection.getAccountInfo(signPda[0], 'finalized');
      if (!signInfo) {
        console.log('[Arcium Client] Pre-initializing SignerAccount PDA...');
        const txInit = await (mxeProgram.methods as any)
          .initSignPda()
          .accounts({
            payer: (provider.wallet as any)?.publicKey,
            signPdaAccount: signPda[0],
            systemProgram: SystemProgram.programId,
          })
          .transaction();
        const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash('finalized');
        txInit.feePayer = (provider.wallet as any)?.publicKey;
        txInit.recentBlockhash = blockhash;
        const signedInit = await (provider.wallet as any).signTransaction(txInit);
        const initSig = await provider.connection.sendRawTransaction(signedInit.serialize(), { skipPreflight: true });
        await provider.connection.confirmTransaction({ signature: initSig, blockhash, lastValidBlockHeight }, 'finalized');
        console.log('[Arcium Client] SignerAccount PDA initialized with tx:', initSig);
      }
    } catch (preInitErr: any) {
      console.warn('[Arcium Client] SignerAccount pre-initialization skipped/failed:', preInitErr?.message || preInitErr);
    }

    const method = (mxeProgram.methods as any)[input.circuit];
    if (!method) throw new Error(`Method ${input.circuit} not found in MXE program`);
    
    console.log('[Arcium Client] Calling MXE program method:', input.circuit);
    
    const baseAccounts: any = {
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
      poolAccount: new PublicKey('7MGSS4iKNM4sVib7bDZDJhVqB6EcchPwVnTKenCY1jt3'),
      systemProgram: SystemProgram.programId,
    };

    const allowList = new Set([
      'payer',
      'signPdaAccount',
      'computationAccount',
      'clusterAccount',
      'mxeAccount',
      'mempoolAccount',
      'executingPool',
      'compDefAccount',
      'clockAccount',
      'arciumProgram',
      'poolAccount',
      'systemProgram',
    ]);

    const mappedOverrides: Record<string, any> = {};
    if (input.accounts) {
      for (const [k, v] of Object.entries(input.accounts)) {
        const key = k === 'cluster' ? 'clusterAccount' : k;
        if (!allowList.has(key)) continue;
        mappedOverrides[key] = typeof v === 'string' ? new PublicKey(v) : v;
      }
    }

    const accounts = { ...baseAccounts, ...mappedOverrides };

    console.log('[Arcium Client] Accounts:', accounts);
    console.log('[Arcium Client] Preparing method call with:');
    console.log('  - compOffset:', compOffset.toString());
    console.log('  - ciphertext count:', cts.length);
    console.log('  - pub length:', pub.length);

    try {
      console.log('[Arcium Client] Fetching latest blockhash...');
      const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash('finalized');
      console.log('[Arcium Client] Latest blockhash:', blockhash);

      const ciphertextArgs = cts.map((ct) => Array.from(ct));
      const heapBytesRaw = process.env.ARCIUM_HEAP_FRAME_BYTES;
      const heapBytes = heapBytesRaw ? parseInt(heapBytesRaw, 10) : DEFAULT_HEAP_FRAME_BYTES;
      const heapInstruction = Number.isFinite(heapBytes) && heapBytes > 0 ? ComputeBudgetProgram.requestHeapFrame({ bytes: heapBytes }) : undefined;
      if (heapInstruction) {
        console.log('[Arcium Client] Requesting heap frame bytes:', heapBytes);
      } else {
        console.warn('[Arcium Client] Heap frame request skipped: invalid ARCIUM_HEAP_FRAME_BYTES value');
      }
      const tx = await method(
        compOffset,
        ...ciphertextArgs,
        Array.from(pub),
        new (anchor as any).BN(deserializeLE(nonce).toString())
      )
        .accountsPartial(accounts)
        .preInstructions(
          [
            heapInstruction,
            ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
          ].filter(Boolean)
        )
        .transaction();

      tx.feePayer = (provider.wallet as any)?.publicKey;
      tx.recentBlockhash = blockhash;
      let signedTx = await (provider.wallet as any).signTransaction(tx);
      try {
        const sig = await provider.connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: true });
        await provider.connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'finalized');
        return { tx: sig, computationOffset: compOffset.toString(), nonceB64: Buffer.from(nonce).toString('base64'), clientPubKeyB64: Buffer.from(pub).toString('base64') };
      } catch (sendErr: any) {
        try {
          const sim = await (mxeProgram.methods as any)[input.circuit](
            compOffset,
            ...ciphertextArgs,
            Array.from(pub),
            new (anchor as any).BN(deserializeLE(nonce).toString())
          )
            .accountsPartial(accounts)
            .preInstructions(
              [
                heapInstruction,
                ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
              ].filter(Boolean)
            )
            .simulate();
          if (sim?.logs) console.error('[Arcium Client] Simulation logs:', sim.logs);
        } catch (simErr1: any) {
          try {
            const sim2 = await provider.connection.simulateTransaction(signedTx ?? tx);
            if (sim2?.value?.logs) console.error('[Arcium Client] Simulation logs:', sim2.value.logs);
            if (sim2?.value?.err) console.error('[Arcium Client] Simulation error:', JSON.stringify(sim2.value.err));
          } catch (simErr2: any) {
            console.error('[Arcium Client] Simulation failed:', simErr2?.message || simErr2);
          }
        }
        throw sendErr;
      }
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
