#!/bin/bash
set -e

echo "============================================="
echo "Switch Flaek MXE to Public Cluster"
echo "============================================="
echo ""
echo "⚠️  WARNING: This will re-initialize your MXE"
echo "   - All 29 circuits need re-initialization"
echo "   - Takes 30-60 minutes"
echo "   - Costs ~0.1 SOL in transaction fees"
echo ""
read -p "Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

cd "$(dirname "$0")/flaek-server"

# Configuration
NEW_CLUSTER_OFFSET=1078779259
MXE_PROGRAM_ID="AF3aPN4n6udY1Uan5jkUrbzFfiquPiXcrTBTNmfR2GP7"
RPC_URL="https://api.devnet.solana.com"
WALLET="$HOME/.config/solana/id.json"

echo ""
echo "Step 1: Getting new cluster pubkey..."
NEW_CLUSTER_PUBKEY=$(node -e "console.log(require('@arcium-hq/client').getClusterAccAddress($NEW_CLUSTER_OFFSET).toBase58())")
echo "   New cluster: $NEW_CLUSTER_PUBKEY"

echo ""
echo "Step 2: Checking wallet balance..."
BALANCE=$(solana balance --url $RPC_URL --keypair $WALLET | awk '{print $1}')
echo "   Balance: $BALANCE SOL"
if (( $(echo "$BALANCE < 0.2" | bc -l) )); then
    echo "   ⚠️  Low balance! You need at least 0.2 SOL"
    echo "   Run: solana airdrop 2 --url devnet"
    exit 1
fi

echo ""
echo "Step 3: Closing old MXE account (to reclaim rent)..."
cd flaek_mxe
# Note: This might fail if MXE has active computations - that's OK
npx ts-node -e "
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { getMXEAccAddress } from '@arcium-hq/client';
import * as fs from 'fs';

(async () => {
  const conn = new Connection('$RPC_URL', 'confirmed');
  const wallet = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync('$WALLET', 'utf-8'))));
  const mxeAddr = getMXEAccAddress(new PublicKey('$MXE_PROGRAM_ID'));
  
  console.log('   Attempting to close:', mxeAddr.toBase58());
  
  try {
    const info = await conn.getAccountInfo(mxeAddr);
    if (!info) {
      console.log('   MXE already closed or never initialized');
      return;
    }
    
    // Close account instruction would go here
    // For now, we'll skip this as it requires the MXE program's close instruction
    console.log('   Skipping close (manual step if needed)');
  } catch (e) {
    console.log('   Could not close:', e.message);
  }
})();
" || echo "   (Close failed - continuing anyway)"

echo ""
echo "Step 4: Re-initializing MXE with new cluster..."
npx ts-node -e "
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { getMXEAccAddress, getArciumProgramId } from '@arcium-hq/client';
import * as fs from 'fs';

(async () => {
  const conn = new Connection('$RPC_URL', 'confirmed');
  const wallet = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync('$WALLET', 'utf-8'))));
  const provider = new anchor.AnchorProvider(conn, new anchor.Wallet(wallet), {});
  
  const idl = JSON.parse(fs.readFileSync('./target/idl/flaek_mxe.json', 'utf-8'));
  const programId = new PublicKey('$MXE_PROGRAM_ID');
  const program = new anchor.Program(idl, programId, provider);
  
  const mxeAccount = getMXEAccAddress(programId);
  const arciumProgram = getArciumProgramId();
  
  console.log('   MXE Account:', mxeAccount.toBase58());
  console.log('   Cluster Offset:', $NEW_CLUSTER_OFFSET);
  
  try {
    const sig = await (program.methods as any)
      .initMxe(new anchor.BN($NEW_CLUSTER_OFFSET))
      .accounts({
        mxeAccount,
        payer: wallet.publicKey,
        arciumProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([wallet])
      .rpc({ commitment: 'confirmed' });
    
    console.log('   ✅ MXE initialized! Tx:', sig);
  } catch (e) {
    console.error('   ❌ Failed:', e.message);
    throw e;
  }
})();
"

echo ""
echo "Step 5: Re-initializing all 29 circuits..."
echo "   This will take 10-20 minutes..."
cd flaek_mxe
ANCHOR_PROVIDER_URL=$RPC_URL ANCHOR_WALLET=$WALLET npx ts-node scripts/init-all-circuits.ts

echo ""
echo "Step 6: Updating .env file..."
cd ..
sed -i.bak "s/ARCIUM_CLUSTER_OFFSET=.*/ARCIUM_CLUSTER_OFFSET=$NEW_CLUSTER_OFFSET/" .env
sed -i.bak "s/ARCIUM_CLUSTER_PUBKEY=.*/ARCIUM_CLUSTER_PUBKEY=$NEW_CLUSTER_PUBKEY/" .env
sed -i.bak '/ARCIUM_MXE_PUBLIC_KEY/d' .env

echo ""
echo "Step 7: Updating database operations..."
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const Operation = mongoose.model('operations');
  
  const result = await Operation.updateMany(
    {},
    { \$set: { 'accounts.cluster': '$NEW_CLUSTER_PUBKEY' } }
  );
  
  console.log('   Updated', result.modifiedCount, 'operations');
  await mongoose.disconnect();
})();
"

echo ""
echo "============================================="
echo "✅ Migration Complete!"
echo "============================================="
echo ""
echo "New configuration:"
echo "   Cluster Offset: $NEW_CLUSTER_OFFSET"
echo "   Cluster Pubkey: $NEW_CLUSTER_PUBKEY"
echo ""
echo "Next steps:"
echo "   1. Restart your server"
echo "   2. Test in Playground"
echo "   3. Check DKG status:"
echo "      arcium mxe-info $MXE_PROGRAM_ID --rpc-url $RPC_URL"
echo ""
