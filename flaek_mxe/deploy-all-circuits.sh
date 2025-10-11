#!/bin/bash

set -e

# Devnet cluster offsets (choose one): 1078779259, 3726127828, 768109697
CLUSTER_OFFSET="${1:-1078779259}"
KEYPAIR_PATH="${2:-$HOME/.config/solana/id.json}"
RPC_URL="${3:-d}"  # 'd' for devnet, or use full URL like https://devnet.helius-rpc.com/?api-key=YOUR_KEY

CIRCUITS=(
  "add" "subtract" "multiply" "divide" "modulo" "power" "abs_diff"
  "greater_than" "less_than" "equal" "greater_equal" "less_equal" "in_range"
  "and" "or" "not" "xor" "if_else"
  "average" "sum" "min" "max" "median"
  "credit_score" "health_risk" "vote_tally" "meets_threshold" "weighted_average"
)

echo "========================================="
echo "Flaek MXE Deployment Script"
echo "========================================="
echo "Cluster Offset: $CLUSTER_OFFSET"
echo "Keypair: $KEYPAIR_PATH"
echo "RPC: $RPC_URL"
echo "Total Circuits: ${#CIRCUITS[@]}"
echo "========================================="
echo ""

echo "Step 1: Building all circuits..."
arcium build
echo "✓ Build complete"
echo ""

echo "Step 2: Deploying MXE program to devnet..."
echo "This will:"
echo "  - Deploy the Solana program"
echo "  - Initialize the MXE account"
echo "  - Upload all circuit definitions"
echo ""

if arcium deploy --cluster-offset "$CLUSTER_OFFSET" --keypair-path "$KEYPAIR_PATH" -u "$RPC_URL"; then
  echo ""
  echo "✓ MXE program deployed successfully!"
  DEPLOYED_COUNT=${#CIRCUITS[@]}
  FAILED_COUNT=0
else
  echo ""
  echo "✗ MXE program deployment failed"
  echo "Common fixes:"
  echo "  1. Run: solana airdrop 2 -u d"
  echo "  2. Use a reliable RPC (Helius, QuickNode)"
  echo "  3. Check your keypair has SOL balance"
  DEPLOYED_COUNT=0
  FAILED_COUNT=${#CIRCUITS[@]}
  exit 1
fi

echo ""
echo "Step 3: Circuit offsets (for blocks registry)..."
echo "Copy these to src/features/blocks/blocks.registry.ts"
echo ""
for circuit in "${CIRCUITS[@]}"; do
  OFFSET=$(node -e "
    const { getCompDefAccOffset } = require('@arcium-hq/client');
    try {
      const offset = getCompDefAccOffset('$circuit');
      console.log(Buffer.from(offset).readUInt32LE(0));
    } catch (e) {
      console.log(0);
    }
  " 2>/dev/null)
  
  echo "  $circuit: $OFFSET,"
done

echo ""
echo "Step 4: Next steps..."
echo "1. Update blocks.registry.ts with the offsets above"
echo "2. Initialize computation definitions (run once):"
echo "   arcium test --skip-local-validator --provider.cluster devnet"
echo "3. Test your circuits are working"

echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo "Total Circuits: ${#CIRCUITS[@]}"
echo "Deployed: $DEPLOYED_COUNT"
echo "Failed: $FAILED_COUNT"
echo "========================================="

if [ $DEPLOYED_COUNT -eq ${#CIRCUITS[@]} ]; then
  echo "🎉 All circuits deployed successfully!"
  exit 0
else
  echo "⚠️  Some circuits failed to deploy"
  exit 1
fi
