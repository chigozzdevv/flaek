import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { x25519, RescueCipher } from '@arcium-hq/client';

export type ArciumJobRequest = {
  programId: string;
  idl: any;
  method: string;
  accounts?: Record<string, string>;
  payload: Buffer;
  mxePublicKeyB64: string;
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

  async submit(req: ArciumJobRequest): Promise<{ tx: string }> {
    const programId = new PublicKey(req.programId);
    const program = new (anchor as any).Program(req.idl as any, programId, this.provider);

    const mxePub = Uint8Array.from(Buffer.from(req.mxePublicKeyB64, 'base64'));

    const bytes = req.payload;
    const limbs: bigint[] = [];
    for (let i = 0; i < bytes.length; i += 4) {
      const v = BigInt(bytes[i] || 0) | (BigInt(bytes[i + 1] || 0) << 8n) | (BigInt(bytes[i + 2] || 0) << 16n) | (BigInt(bytes[i + 3] || 0) << 24n);
      limbs.push(v);
    }
    const priv = x25519.utils.randomSecretKey();
    const pub = x25519.getPublicKey(priv);
    const shared = x25519.getSharedSecret(priv, mxePub);
    const cipher = new RescueCipher(shared);
    const nonce = Buffer.from(Math.random().toString(36).slice(2, 18));
    const ct = cipher.encrypt(limbs, Buffer.from(nonce));

    const method = (program.methods as any)[req.method];
    if (!method) throw new Error(`Method ${req.method} not found in program`);

    const tx = await method(
      new (anchor as any).BN(0),
      Array.from(ct[0] as unknown as Uint8Array),
      Array.from(ct[1] as unknown as Uint8Array),
      Array.from(pub),
      new (anchor as any).BN(0)
    )
      .accountsPartial(req.accounts || {})
      .rpc({ skipPreflight: true, commitment: 'confirmed' });

    return { tx };
  }
}
