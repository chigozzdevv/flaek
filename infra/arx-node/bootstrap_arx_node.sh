#!/usr/bin/env bash
set -euo pipefail

# Inputs (environment variables)
#   HELIUS_API_KEY         (required) — Devnet RPC API key
#   NODE_OFFSET            (required) — unique per node (e.g., 71000001)
#   HOST_IP                (required) — this VM's public IP
#   CLUSTER_OFFSET         (optional) — numeric cluster offset (preferred)
#   CLUSTER_PUBKEY         (optional) — cluster account pubkey (fallback if CLI supports it)
#   SOLANA_VERSION         (optional) — default v1.18.18

HELIUS_API_KEY=${HELIUS_API_KEY:-}
NODE_OFFSET=${NODE_OFFSET:-}
HOST_IP=${HOST_IP:-}
CLUSTER_OFFSET=${CLUSTER_OFFSET:-}
CLUSTER_PUBKEY=${CLUSTER_PUBKEY:-}
SOLANA_VERSION=${SOLANA_VERSION:-v1.18.18}

if [[ -z "$HELIUS_API_KEY" || -z "$NODE_OFFSET" || -z "$HOST_IP" ]]; then
  echo "Missing required env: HELIUS_API_KEY, NODE_OFFSET, HOST_IP" >&2
  exit 1
fi

RPC_HTTP="https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}"
RPC_WSS="wss://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}"

export DEBIAN_FRONTEND=noninteractive
echo "[1/9] Update apt and install prerequisites"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release openssl git apt-transport-https

echo "[2/9] Install Docker Engine + compose"
if ! command -v docker >/dev/null 2>&1; then
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

echo "[2.1/9] Enable and start Docker"
sudo systemctl daemon-reload || true
sudo systemctl enable --now docker || sudo service docker start || true
# wait for docker daemon up
for i in {1..20}; do
  if sudo docker info >/dev/null 2>&1; then
    break
  fi
  echo "  - waiting for docker daemon... ($i/20)"
  sleep 2
done
if ! sudo docker info >/dev/null 2>&1; then
  echo "Docker daemon is not responding after wait. Exiting." >&2
  exit 1
fi

if [[ "${BOOTSTRAP_MODE:-full}" != "prepare" ]]; then
echo "[3/9] Install Arcium tooling via arcup (non-interactive)"
export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$PATH"
if ! command -v arcup >/dev/null 2>&1; then
  mkdir -p "$HOME/.local/bin"
  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64) TARGET="x86_64_linux" ;;
    aarch64|arm64) TARGET="aarch64_linux" ;;
    *) echo "Unsupported architecture: $ARCH" >&2; exit 1 ;;
  esac
  ARCIUM_ARCUP_VERSION=${ARCIUM_ARCUP_VERSION:-0.3.0}
  URL="https://bin.arcium.com/download/arcup_${TARGET}_${ARCIUM_ARCUP_VERSION}"
  echo "  - downloading arcup ($TARGET $ARCIUM_ARCUP_VERSION)"
  curl -fsSL "$URL" -o "$HOME/.local/bin/arcup"
  chmod +x "$HOME/.local/bin/arcup"
fi
# Try as user first, then with sudo (for docker access)
echo "  - running arcup install (user)"
arcup install || true
echo "  - running arcup install (with sudo)"
sudo -E env PATH="$HOME/.local/bin:/usr/local/bin:$PATH" arcup install || true

# Ensure arcium binary is on PATH for the current user
# Resolve arcium binary location and ensure it's runnable
ARCIUM_BIN=""
if command -v arcium >/dev/null 2>&1; then
  ARCIUM_BIN="$(command -v arcium)"
else
  # Try common install locations and sudo which
  CANDIDATES=(
    /usr/local/bin/arcium
    /usr/bin/arcium
    "$HOME/.cargo/bin/arcium"
    "$HOME/.local/bin/arcium"
    /root/.local/bin/arcium
    /root/.cargo/bin/arcium
    /usr/local/sbin/arcium
    /sbin/arcium
    /snap/bin/arcium
  )
  for c in "${CANDIDATES[@]}"; do
    if sudo test -x "$c"; then ARCIUM_BIN="$c"; break; fi
  done
  if [[ -z "$ARCIUM_BIN" ]]; then
    # Last resort: detect via sudo which
    ARCIUM_BIN="$(sudo env PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" which arcium 2>/dev/null || true)"
  fi
  if [[ -n "$ARCIUM_BIN" && "$ARCIUM_BIN" != "/usr/local/bin/arcium" ]]; then
    echo "  - installing arcium from $ARCIUM_BIN to /usr/local/bin"
    sudo install -m 0755 "$ARCIUM_BIN" /usr/local/bin/arcium || true
    ARCIUM_BIN="/usr/local/bin/arcium"
  fi
fi

if [[ -z "$ARCIUM_BIN" ]]; then
  echo "ERROR: 'arcium' binary not found after arcup install. Please SSH into the VM and run 'sudo -E arcup install' manually, then re-run this script." >&2
  exit 1
fi

"$ARCIUM_BIN" --version || true
fi

echo "[4/9] Install Solana CLI ${SOLANA_VERSION} (anza)"
if ! command -v solana >/dev/null 2>&1; then
  # New official host moved from release.solana.com -> release.anza.xyz
  sh -c "$(curl -sSfL https://release.anza.xyz/${SOLANA_VERSION}/install)"
  export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
  echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.local/bin:$PATH"' >> "$HOME/.profile"
fi

echo "[5/9] Generate keys (if missing)"
[[ -f node-keypair.json ]] || solana-keygen new --no-bip39-passphrase --outfile node-keypair.json
[[ -f callback-kp.json ]] || solana-keygen new --no-bip39-passphrase --outfile callback-kp.json
if [[ ! -f identity.pem ]]; then
  openssl genpkey -algorithm Ed25519 -out identity.pem
  chmod 600 identity.pem
fi

echo "[6/9] Addresses"
export SOLANA_URL=https://api.devnet.solana.com
NODE_ADDR=$(solana address --keypair node-keypair.json)
CALLBACK_ADDR=$(solana address --keypair callback-kp.json)

echo "Node details:"
echo "  - node authority pubkey:     $NODE_ADDR"
echo "  - callback authority pubkey: $CALLBACK_ADDR"
echo "  - node offset:               $NODE_OFFSET"
echo "  - public IP:                 $HOST_IP"

# Optional auto-airdrop; default off to avoid rate-limit noise
AUTO_AIRDROP=${AUTO_AIRDROP:-0}
if [[ "$AUTO_AIRDROP" == "1" ]]; then
  echo "Attempting airdrops (may be rate-limited)"
  solana airdrop 2 "$NODE_ADDR" -u devnet || true
  solana airdrop 2 "$CALLBACK_ADDR" -u devnet || true
fi

# If only preparing addresses for manual funding, exit early
BOOTSTRAP_MODE=${BOOTSTRAP_MODE:-full}
if [[ "$BOOTSTRAP_MODE" == "prepare" ]]; then
  echo "Prepare mode: addresses printed. Exiting before init-arx-accs."
  exit 0
fi

echo "[7/9] Initialize ARX accounts onchain"
"$ARCIUM_BIN" init-arx-accs \
  --keypair-path node-keypair.json \
  --callback-keypair-path callback-kp.json \
  --peer-keypair-path identity.pem \
  --node-offset "$NODE_OFFSET" \
  --ip-address "$HOST_IP" \
  --rpc-url "$RPC_HTTP"

echo "[8/9] Join cluster (with invite polling)"
JOIN_MAX_ATTEMPTS=${JOIN_MAX_ATTEMPTS:-40}      # ~20 minutes at 30s interval
JOIN_RETRY_DELAY=${JOIN_RETRY_DELAY:-30}

join_attempt() {
  local EXTRA="$1"  # either --cluster-offset <x> or --cluster-pubkey <pk>
  "$ARCIUM_BIN" join-cluster true \
    --keypair-path node-keypair.json \
    --node-offset "$NODE_OFFSET" \
    $EXTRA \
    --rpc-url "$RPC_HTTP"
}

if [[ -n "$CLUSTER_OFFSET" ]]; then
  EXTRA_ARG=(--cluster-offset "$CLUSTER_OFFSET")

  attempt=1
  while (( attempt <= JOIN_MAX_ATTEMPTS )); do
    echo "  - join attempt $attempt/$JOIN_MAX_ATTEMPTS"
    if join_attempt "${EXTRA_ARG[@]}"; then
      echo "  ✓ joined cluster"
      break
    else
      echo "  ⨯ join failed (likely no invite yet). Waiting ${JOIN_RETRY_DELAY}s..."
      sleep "$JOIN_RETRY_DELAY"
      ((attempt++))
    fi
  done

  if (( attempt > JOIN_MAX_ATTEMPTS )); then
    echo "WARNING: Could not join cluster after $JOIN_MAX_ATTEMPTS attempts. Ensure the cluster authority invited NODE_OFFSET=$NODE_OFFSET." >&2
  fi
else
  echo "WARNING: CLUSTER_OFFSET not provided — skipping join-cluster (your CLI requires --cluster-offset)"
fi

echo "[9/9] Write config and start container"
cat > node-config.toml <<EOF
[node]
offset = ${NODE_OFFSET}
hardware_claim = 0
starting_epoch = 0
ending_epoch = 9223372036854775807

[network]
address = "0.0.0.0"

[solana]
endpoint_rpc = "${RPC_HTTP}"
endpoint_wss = "${RPC_WSS}"
cluster = "Devnet"
commitment.commitment = "confirmed"
EOF

mkdir -p arx-node-logs && touch arx-node-logs/arx.log

echo "Starting container (docker run)..."
sudo docker rm -f arx-node >/dev/null 2>&1 || true
sudo docker run -d \
  --name arx-node \
  -e NODE_IDENTITY_FILE=/usr/arx-node/node-keys/node_identity.pem \
  -e NODE_KEYPAIR_FILE=/usr/arx-node/node-keys/node_keypair.json \
  -e OPERATOR_KEYPAIR_FILE=/usr/arx-node/node-keys/operator_keypair.json \
  -e CALLBACK_AUTHORITY_KEYPAIR_FILE=/usr/arx-node/node-keys/callback_authority_keypair.json \
  -e NODE_CONFIG_PATH=/usr/arx-node/arx/node_config.toml \
  -v "$(pwd)/node-config.toml:/usr/arx-node/arx/node_config.toml" \
  -v "$(pwd)/node-keypair.json:/usr/arx-node/node-keys/node_keypair.json:ro" \
  -v "$(pwd)/node-keypair.json:/usr/arx-node/node-keys/operator_keypair.json:ro" \
  -v "$(pwd)/callback-kp.json:/usr/arx-node/node-keys/callback_authority_keypair.json:ro" \
  -v "$(pwd)/identity.pem:/usr/arx-node/node-keys/node_identity.pem:ro" \
  -v "$(pwd)/arx-node-logs:/usr/arx-node/logs" \
  -p 8080:8080 \
  --restart unless-stopped \
  arcium/arx-node

sudo docker logs -f --tail=100 arx-node &

echo "\nSanity checks:"
"$ARCIUM_BIN" arx-info "$NODE_OFFSET" --rpc-url "$RPC_HTTP" || true
"$ARCIUM_BIN" arx-active "$NODE_OFFSET" --rpc-url "$RPC_HTTP" || true

echo "Done."
