export class SolanaClient {
  async anchorBatch(_hashes: string[]): Promise<{ tx: string; batchRoot: string }> {
    return { tx: 'dummy_tx', batchRoot: 'dummy_root' };
  }
}

