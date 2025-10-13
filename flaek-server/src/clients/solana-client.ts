import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import * as crypto from 'crypto';

export class SolanaClient {
  private connection: Connection;
  private payer: Keypair | null = null;

  constructor(rpcUrl?: string, secretKey?: string) {
    this.connection = new Connection(rpcUrl || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');

    if (secretKey || process.env.ARCIUM_SOLANA_SECRET_KEY) {
      const secret = secretKey || process.env.ARCIUM_SOLANA_SECRET_KEY!;
      this.payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
    }
  }

  async anchorBatch(hashes: string[]): Promise<{ tx: string; batchRoot: string }> {
    if (hashes.length === 0) {
      throw new Error('Cannot anchor empty batch');
    }

    const merkleRoot = this.computeMerkleRoot(hashes);

    if (!this.payer) {
      return { tx: `pending_${merkleRoot.slice(0, 8)}`, batchRoot: merkleRoot };
    }

    try {
      const memoData = Buffer.from(`FLAEK_ATTESTATION:${merkleRoot}`, 'utf-8');

      const instruction = SystemProgram.transfer({
        fromPubkey: this.payer.publicKey,
        toPubkey: this.payer.publicKey,
        lamports: 0,
      });

      const memoInstruction = {
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: memoData,
      };

      const transaction = new Transaction().add(instruction).add(memoInstruction);

      const signature = await this.connection.sendTransaction(transaction, [this.payer], {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        tx: signature,
        batchRoot: merkleRoot,
      };
    } catch (error) {
      console.error('Failed to anchor batch to Solana:', error);
      return {
        tx: `error_${merkleRoot.slice(0, 8)}`,
        batchRoot: merkleRoot,
      };
    }
  }

  private computeMerkleRoot(hashes: string[]): string {
    if (hashes.length === 1) {
      return hashes[0];
    }

    let level: Buffer[] = hashes.map(h => Buffer.from(h, 'hex'));

    while (level.length > 1) {
      const nextLevel: Buffer[] = [];

      for (let i = 0; i < level.length; i += 2) {
        if (i + 1 < level.length) {
          const combined = Buffer.concat([level[i], level[i + 1]]);
          const hash = crypto.createHash('sha256').update(combined).digest();
          nextLevel.push(hash);
        } else {
          nextLevel.push(level[i]);
        }
      }

      level = nextLevel;
    }

    return level[0].toString('hex');
  }
}

