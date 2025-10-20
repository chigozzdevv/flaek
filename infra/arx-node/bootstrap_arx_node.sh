#!/usr/bin/env bash
set -euo pipefail

# Inputs (environment variables)
#   HELIUS_API_KEY         (required) — Devnet RPC API key
#   NODE_OFFSET            (required) — unique per node (e.g., 71000001)
#   HOST_IP                (required) — this VM's public IP
#   CLUSTER_OFFSET         (optional) — numeric cluster offset (preferred)
#   CLUSTER_PUBKEY         (optional) — cluster account pubkey (fallback if CLI supports it)
#   SOLANA_VERSION         (optional) — default v1.18.18

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

MANIFEST_PATH="$(resolve_manifest_path || true)"

HELIUS_API_KEY=${HELIUS_API_KEY:-$(extract_api_key "${HELIUS_RPC:-$(env_get HELIUS_RPC || true)}")}
if [[ -z "$HELIUS_API_KEY" ]]; then
  HELIUS_API_KEY=$(extract_api_key "${SOLANA_RPC_URL:-$(env_get SOLANA_RPC_URL || true)}")
fi

NODE_OFFSET=${NODE_OFFSET:-}
HOST_IP=${HOST_IP:-}
CLUSTER_OFFSET=${CLUSTER_OFFSET:-${ARCIUM_CLUSTER_OFFSET:-$(env_get ARCIUM_CLUSTER_OFFSET || true)}}
CLUSTER_PUBKEY=${CLUSTER_PUBKEY:-${ARCIUM_CLUSTER_PUBKEY:-$(env_get ARCIUM_CLUSTER_PUBKEY || true)}}
SOLANA_VERSION=${SOLANA_VERSION:-v1.18.18}

if [[ -z "$HELIUS_API_KEY" ]]; then
  echo "Missing HELIUS_API_KEY (set env or ensure SOLANA_RPC_URL/HELIUS_RPC in .env)" >&2
  exit 1
fi

if [[ -z "$NODE_OFFSET" ]]; then
  if [[ -n "$MANIFEST_PATH" ]]; then
    # Assign first unused offset from manifest
    NODE_OFFSET=$(
      python3 - "$MANIFEST_PATH" <<'PY'
import json, sys
path = sys.argv[1]
with open(path, 'r', encoding='utf-8') as f:
    entries = json.load(f)
for entry in entries:
    name = entry.get('name')
    offset = entry.get('offset')
    if not name or offset is None:
        continue
    # mark file to avoid reuse
    flag = f"/tmp/arx-node-{offset}.claimed"
    try:
        with open(flag, 'x'):
            pass
        print(offset)
        break
    except FileExistsError:
        continue
PY
    )
  fi
  if [[ -z "$NODE_OFFSET" ]]; then
    echo "Missing NODE_OFFSET (set env or provide in manifest)" >&2
    exit 1
  fi
fi

if [[ -z "$HOST_IP" ]]; then
  HOST_IP=$(curl -fsS https://api.ipify.org || true)
  if [[ -z "$HOST_IP" ]]; then
    echo "Unable to determine HOST_IP automatically; set HOST_IP." >&2
    exit 1
  fi
fi

if [[ -z "$CLUSTER_OFFSET" && -n "$CLUSTER_PUBKEY" ]]; then
  CLUSTER_OFFSET=$(node -e "try{const {getClusterAccOffset}=require('@arcium-hq/client'); console.log(getClusterAccOffset('$CLUSTER_PUBKEY'))}catch(e){process.exit(1)}" 2>/dev/null || true)
fi

if [[ -z "$CLUSTER_OFFSET" ]]; then
  echo "CLUSTER_OFFSET is required (set ARCIUM_CLUSTER_OFFSET or export CLUSTER_OFFSET)." >&2
  exit 1
fi

RPC_HTTP="https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}"
RPC_WSS="wss://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}"

export DEBIAN_FRONTEND=noninteractive
echo "[1/9] Update apt and install prerequisites"
sudo -E apt-get update -y
sudo -E apt-get install -y ca-certificates curl gnupg lsb-release openssl git apt-transport-https

echo "[2/9] Install Docker Engine + compose"

docker_ready() {
  # wait up to 180s for docker to become responsive
  for i in {1..60}; do
    if sudo docker info >/dev/null 2>&1; then
      echo "  - Docker daemon is ready"
      return 0
    fi
    echo "  - waiting for docker daemon... ($i/60)"
    sleep 3
  done
  return 1
}

ensure_docker() {
  if command -v docker >/dev/null 2>&1; then
    # try to start and wait
    sudo systemctl daemon-reload || true
    sudo systemctl enable docker || true
    sudo systemctl start docker || sudo service docker start || true
    docker_ready && return 0
    echo "  - docker installed but not responding; attempting restart"
    sudo systemctl restart docker || true
    docker_ready && return 0
    echo "  - docker still not responding; will reinstall via official get.docker.com"
  fi

  # Install repo + packages (Ubuntu/Debian)
  sudo install -m 0755 -d /etc/apt/keyrings
  . /etc/os-release
  DIST_ID=${ID:-debian}
  CODENAME=${VERSION_CODENAME:-bookworm}
  case "$DIST_ID" in
    ubuntu)
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $CODENAME stable" | \
        sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
      ;;
    *)
      curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $CODENAME stable" | \
        sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
      ;;
  esac
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  sudo -E apt-get update -y
  sudo -E apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin || true

  # Enable and start
  sudo systemctl daemon-reload || true
  sudo systemctl enable docker || true
  sudo systemctl start docker || sudo service docker start || true
  if docker_ready; then return 0; fi

  # Fallback: docker convenience script
  echo "  - Falling back to get.docker.com convenience script"
  curl -fsSL https://get.docker.com | sh
  sudo systemctl enable docker || true
  sudo systemctl start docker || true
  if ! docker_ready; then
    echo "Docker daemon is not responding. Please ensure Docker is running." >&2
    # Print diagnostics
    (sudo systemctl status docker || true) | tail -n 50 >&2
    (sudo journalctl -u docker --no-pager | tail -n 200) >&2 || true
    exit 1
  fi
}

ensure_docker

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

echo "[7/9] Ensure ARX accounts exist (init if needed)"
INIT_LOG=/tmp/init-arx-accs-$NODE_OFFSET.log
set +e
"$ARCIUM_BIN" init-arx-accs \
  --keypair-path node-keypair.json \
  --callback-keypair-path callback-kp.json \
  --peer-keypair-path identity.pem \
  --node-offset "$NODE_OFFSET" \
  --ip-address "$HOST_IP" \
  --rpc-url "$RPC_HTTP" 2>&1 | tee "$INIT_LOG"
INIT_RC=${PIPESTATUS[0]}
set -e
if [[ $INIT_RC -eq 0 ]]; then
  echo "  - ARX accounts initialized"
else
  if grep -Ei "(already|exists|initialized)" "$INIT_LOG" >/dev/null 2>&1; then
    echo "  - Accounts already initialized (ok)"
  else
    echo "  - init-arx-accs failed (see $INIT_LOG)" >&2
    exit 1
  fi
fi

echo "[8/9] Join cluster (with invite polling)"
JOIN_MAX_ATTEMPTS=${JOIN_MAX_ATTEMPTS:-40}      # ~20 minutes at 30s interval
JOIN_RETRY_DELAY=${JOIN_RETRY_DELAY:-30}

join_attempt() {
  # Node acceptance of invite (per docs)
  "$ARCIUM_BIN" join-cluster true \
    --keypair-path node-keypair.json \
    --node-offset "$NODE_OFFSET" \
    "$@" \
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
# Ensure docker is healthy again before starting container (covers long gaps between steps)
ensure_docker
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
  --network host \
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
  --restart unless-stopped \
  arcium/arx-node

sudo docker logs -f --tail=100 arx-node &

echo "\nSanity checks:"
"$ARCIUM_BIN" arx-info "$NODE_OFFSET" --rpc-url "$RPC_HTTP" || true
"$ARCIUM_BIN" arx-active "$NODE_OFFSET" --rpc-url "$RPC_HTTP" || true

echo "Done."
