#!/usr/bin/env bash
set -euo pipefail

# Provision three ARX nodes on GCE end-to-end.
# Creates (if missing): static IPs, firewall rule, VMs; then copies and runs bootstrap on each.

# Inputs via env (edit/export before running):
#   PROJECT                 (optional)  — defaults to current gcloud config project
#   REGION                  (default: us-central1)
#   ZONE                    (default: us-central1-a)
#   MACHINE_TYPE            (default: e2-standard-4)
#   HELIUS_API_KEY          (required)  — Devnet RPC key
#   CLUSTER_OFFSET          (optional)  — numeric cluster offset (preferred)
#   CLUSTER_PUBKEY          (optional)  — cluster account pubkey (fallback)
#   NODE_OFFSET_A           (default: 71000001)
#   NODE_OFFSET_B           (default: 71000002)
#   NODE_OFFSET_C           (default: 71000003)
#   ARX_NODE_A              (default: arx-node-a) — instance & address name
#   ARX_NODE_B              (default: arx-node-b)
#   ARX_NODE_C              (default: arx-node-c)

PROJECT=${PROJECT:-$(gcloud config get-value project 2>/dev/null || echo "")}
REGION=${REGION:-us-central1}
ZONE=${ZONE:-us-central1-a}
MACHINE_TYPE=${MACHINE_TYPE:-e2-standard-4}

# Try to source values from repo's .env if not provided (resolve path relative to script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if git -C "$SCRIPT_DIR" rev-parse --show-toplevel >/dev/null 2>&1; then
  REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
else
  REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi
ENV_FILE="$REPO_ROOT/flaek-server/.env"

env_get() {
  local key="$1"
  [[ -f "$ENV_FILE" ]] || return 1
  # Grep exact key= line, ignore comments, take last occurrence, strip quotes
  local line
  line=$(grep -E "^${key}=" "$ENV_FILE" | tail -n1 | cut -d= -f2-)
  # Trim surrounding quotes if present
  line=${line%\r}
  line=${line%\n}
  line=${line#\'}; line=${line%\'}; line=${line#\"}; line=${line%\"}
  printf '%s' "$line"
}

# Defaults from env file
if [[ -f "$ENV_FILE" ]]; then
  echo "Using env file: $ENV_FILE"
fi
SOLANA_RPC_URL_DEFAULT="$(env_get SOLANA_RPC_URL || true)"
HELIUS_RPC_DEFAULT="$(env_get HELIUS_RPC || true)"
ARCIUM_CLUSTER_PUBKEY_DEFAULT="$(env_get ARCIUM_CLUSTER_PUBKEY || true)"

extract_api_key() {
  # Extract api-key= from URL query
  echo "$1" | sed -n 's/.*[?&]api-key=\([^&]*\).*/\1/p'
}

# Inputs with fallbacks
HELIUS_API_KEY=${HELIUS_API_KEY:-}
if [[ -z "$HELIUS_API_KEY" ]]; then
  if [[ -n "$HELIUS_RPC_DEFAULT" ]]; then
    HELIUS_API_KEY=$(extract_api_key "$HELIUS_RPC_DEFAULT")
  elif [[ -n "$SOLANA_RPC_URL_DEFAULT" ]]; then
    HELIUS_API_KEY=$(extract_api_key "$SOLANA_RPC_URL_DEFAULT")
  fi
fi

CLUSTER_OFFSET=${CLUSTER_OFFSET:-}
CLUSTER_PUBKEY=${CLUSTER_PUBKEY:-${ARCIUM_CLUSTER_PUBKEY_DEFAULT:-}}

NODE_OFFSET_A=${NODE_OFFSET_A:-71000001}
NODE_OFFSET_B=${NODE_OFFSET_B:-71000002}
NODE_OFFSET_C=${NODE_OFFSET_C:-71000003}

ARX_NODE_A=${ARX_NODE_A:-arx-node-a}
ARX_NODE_B=${ARX_NODE_B:-arx-node-b}
ARX_NODE_C=${ARX_NODE_C:-arx-node-c}

if [[ -z "$PROJECT" ]]; then
  echo "PROJECT not set and no gcloud project configured. Run: gcloud init" >&2
  exit 1
fi

if [[ -z "$HELIUS_API_KEY" ]]; then
  echo "HELIUS_API_KEY is required (not found in env or flaek-server/.env)" >&2
  exit 1
fi

if [[ -z "$CLUSTER_OFFSET" ]]; then
  if [[ -n "$CLUSTER_PUBKEY" ]]; then
    echo "Your arcium CLI requires --cluster-offset (pubkey not supported)."
    read -p "Enter numeric CLUSTER_OFFSET for $CLUSTER_PUBKEY: " CLUSTER_OFFSET
    export CLUSTER_OFFSET
  else
    read -p "Enter numeric CLUSTER_OFFSET: " CLUSTER_OFFSET
    export CLUSTER_OFFSET
  fi
fi
if [[ -z "$CLUSTER_OFFSET" ]]; then
  echo "CLUSTER_OFFSET is required." >&2
  exit 1
fi

echo "[0/7] Using project: $PROJECT | region: $REGION | zone: $ZONE"

echo "[0.5/7] Ensuring local SSH key exists (non-interactive)"
if [[ ! -f "$HOME/.ssh/google_compute_engine" || ! -f "$HOME/.ssh/google_compute_engine.pub" ]]; then
  mkdir -p "$HOME/.ssh" && chmod 700 "$HOME/.ssh"
  ssh-keygen -t rsa -b 4096 -f "$HOME/.ssh/google_compute_engine" -N "" -C "$USER@$(hostname)" >/dev/null
  chmod 600 "$HOME/.ssh/google_compute_engine" || true
fi
gcloud compute config-ssh --quiet --project "$PROJECT" >/dev/null || true

echo "[1/7] Ensure Compute Engine API is enabled (idempotent)"
gcloud services enable compute.googleapis.com --project "$PROJECT" >/dev/null || true

echo "[2/7] Ensure static IPs (addresses) exist"
ensure_address() {
  local NAME=$1
  if ! gcloud compute addresses describe "$NAME" --region "$REGION" --project "$PROJECT" >/dev/null 2>&1; then
    echo "  - creating address: $NAME"
    gcloud compute addresses create "$NAME" --region "$REGION" --project "$PROJECT" >/dev/null
  else
    echo "  - address exists: $NAME"
  fi
}
ensure_address "$ARX_NODE_A"
ensure_address "$ARX_NODE_B"
ensure_address "$ARX_NODE_C"

IP_A=$(gcloud compute addresses describe "$ARX_NODE_A" --region "$REGION" --project "$PROJECT" --format='get(address)')
IP_B=$(gcloud compute addresses describe "$ARX_NODE_B" --region "$REGION" --project "$PROJECT" --format='get(address)')
IP_C=$(gcloud compute addresses describe "$ARX_NODE_C" --region "$REGION" --project "$PROJECT" --format='get(address)')
echo "  - $ARX_NODE_A => $IP_A"
echo "  - $ARX_NODE_B => $IP_B"
echo "  - $ARX_NODE_C => $IP_C"

echo "[3/7] Ensure firewall rule for tcp:8080 (network tag: arx-node)"
if ! gcloud compute firewall-rules describe allow-arx-8080 --project "$PROJECT" >/dev/null 2>&1; then
  gcloud compute firewall-rules create allow-arx-8080 \
    --allow tcp:8080 \
    --target-tags=arx-node \
    --direction=INGRESS \
    --project "$PROJECT" >/dev/null
  echo "  - created firewall rule allow-arx-8080"
else
  echo "  - firewall rule allow-arx-8080 exists"
fi

echo "[4/7] Ensure instances exist (Debian 12, $MACHINE_TYPE)"
ensure_instance() {
  local NAME=$1
  local IP=$2
  if ! gcloud compute instances describe "$NAME" --zone "$ZONE" --project "$PROJECT" >/dev/null 2>&1; then
    echo "  - creating instance: $NAME ($IP)"
    gcloud compute instances create "$NAME" \
      --zone "$ZONE" \
      --machine-type "$MACHINE_TYPE" \
      --image-family debian-12 \
      --image-project debian-cloud \
      --address "$IP" \
      --tags arx-node \
      --project "$PROJECT" >/dev/null
  else
    echo "  - instance exists: $NAME"
  fi
}
ensure_instance "$ARX_NODE_A" "$IP_A"
ensure_instance "$ARX_NODE_B" "$IP_B"
ensure_instance "$ARX_NODE_C" "$IP_C"

echo "[5/7] Copy bootstrap script to instances"
SCRIPT_PATH="$SCRIPT_DIR/bootstrap_arx_node.sh"
if [[ ! -f "$SCRIPT_PATH" ]]; then
  echo "ERROR: Bootstrap script not found at: $SCRIPT_PATH" >&2
  exit 1
fi
for NAME in "$ARX_NODE_A" "$ARX_NODE_B" "$ARX_NODE_C"; do
  gcloud compute scp "$SCRIPT_PATH" "$NAME":~/ --zone "$ZONE" --project "$PROJECT" >/dev/null
done

echo "[6/7] Run bootstrap (prepare) on each instance to get addresses"
run_bootstrap_prepare() {
  local NAME=$1
  local OFFSET=$2
  local IP=$3

  # Compose cluster export part
  local CLUSTER_EXPORT
  CLUSTER_EXPORT="export CLUSTER_OFFSET=$CLUSTER_OFFSET;"

  echo "  - $NAME (offset=$OFFSET, ip=$IP)"
  gcloud compute ssh "$NAME" --zone "$ZONE" --project "$PROJECT" --command "
    export HELIUS_API_KEY=$HELIUS_API_KEY; 
    $CLUSTER_EXPORT
    export NODE_OFFSET=$OFFSET; 
    export HOST_IP=$IP; 
    export BOOTSTRAP_MODE=prepare; 
    bash ~/bootstrap_arx_node.sh
  " >/dev/null
}
run_bootstrap_prepare "$ARX_NODE_A" "$NODE_OFFSET_A" "$IP_A"
run_bootstrap_prepare "$ARX_NODE_B" "$NODE_OFFSET_B" "$IP_B"
run_bootstrap_prepare "$ARX_NODE_C" "$NODE_OFFSET_C" "$IP_C"

echo "[6.5/7] Addresses for manual funding (Devnet):"

fetch_pubkeys() {
  local NAME=$1
  gcloud compute ssh "$NAME" --zone "$ZONE" --project "$PROJECT" --command '
    export PATH=$HOME/.local/share/solana/install/active_release/bin:$HOME/.local/bin:$PATH
    NODE=$(solana address --keypair node-keypair.json 2>/dev/null || true)
    CALLBACK=$(solana address --keypair callback-kp.json 2>/dev/null || true)
    echo "$NODE|$CALLBACK"
  ' 2>/dev/null | tail -n1
}

PK_A=$(fetch_pubkeys "$ARX_NODE_A")
PK_B=$(fetch_pubkeys "$ARX_NODE_B")
PK_C=$(fetch_pubkeys "$ARX_NODE_C")

NA=${PK_A%%|*}; CA=${PK_A##*|}
NB=${PK_B%%|*}; CB=${PK_B##*|}
NC=${PK_C%%|*}; CC=${PK_C##*|}

printf "\nProvide these to the cluster authority to invite your nodes:\n"
printf "  - %s offset=%s ip=%s node_pubkey=%s callback_pubkey=%s\n" "$ARX_NODE_A" "$NODE_OFFSET_A" "$IP_A" "$NA" "$CA"
printf "  - %s offset=%s ip=%s node_pubkey=%s callback_pubkey=%s\n" "$ARX_NODE_B" "$NODE_OFFSET_B" "$IP_B" "$NB" "$CB"
printf "  - %s offset=%s ip=%s node_pubkey=%s callback_pubkey=%s\n" "$ARX_NODE_C" "$NODE_OFFSET_C" "$IP_C" "$NC" "$CC"

printf "\nLocal funding helper (optional)\n"
if command -v solana >/dev/null 2>&1; then
  RPC="https://devnet.helius-rpc.com/?api-key=$HELIUS_API_KEY"
  NODE_FUND=${NODE_FUND:-2}
  CALLBACK_FUND=${CALLBACK_FUND:-2}
  THRESH_NODE=${THRESH_NODE:-1.5}
  THRESH_CALLBACK=${THRESH_CALLBACK:-1.5}

  # Determine funding wallet
  FUND_ARGS=()
  if [[ -n "${FUND_KEYPAIR:-}" ]]; then
    FUND_ADDR=$(solana address --keypair "$FUND_KEYPAIR" --url "$RPC" 2>/dev/null || true)
    FUND_ARGS+=(--keypair "$FUND_KEYPAIR")
  else
    FUND_ADDR=$(solana address --url "$RPC" 2>/dev/null || true)
  fi
  if [[ -z "$FUND_ADDR" ]]; then
    echo "  - Could not determine local Solana wallet address. Ensure Solana CLI is configured." >&2
  else
    echo "  - Fund this local wallet (2 airdrops recommended): $FUND_ADDR"
    echo "    Example: solana airdrop 5 $FUND_ADDR -u devnet (repeat twice)"
  fi

  read -p $'Press Enter after funding the local wallet to distribute/top-up node addresses…' _

  # Build solana command base
  SOLANA_CMD=(solana --url "$RPC")
  if (( ${#FUND_ARGS[@]} )); then SOLANA_CMD+=("${FUND_ARGS[@]}"); fi

  sol_balance() { addr=$1; "${SOLANA_CMD[@]}" balance "$addr" 2>/dev/null | awk '{print $1}'; }

  echo "Top-up logic: skip if balance >= threshold (node=${THRESH_NODE}, callback=${THRESH_CALLBACK})"
  topup() {
    local who=$1 addr=$2 target=$3 thresh=$4
    if [[ -z "$addr" ]]; then return; fi
    bal=$(sol_balance "$addr")
    # If parsing fails, default to 0
    [[ -z "$bal" ]] && bal=0
    need=$(python3 - <<PY 2>/dev/null || echo 0
t=$target
b=$bal
print(max(0.0, t-b))
PY
)
    # Fallback if python3 absent: transfer full target
    if ! [[ "$need" =~ ^[0-9] ]]; then need=$target; fi
    cmp=$(awk -v b="$bal" -v th="$thresh" 'BEGIN{if (b+0>=th+0) print 1; else print 0;}')
    if [[ "$cmp" == "1" ]]; then
      echo "  - $who $addr has ${bal} SOL >= ${thresh}, skip"
    else
      echo "  - topping up $who $addr by ${need} SOL (target ${target})"
      "${SOLANA_CMD[@]}" transfer "$addr" "$need" --allow-unfunded-recipient --no-wait || true
    fi
  }

  echo "Evaluating and topping up balances…"
  topup "node A"     "$NA" "$NODE_FUND"     "$THRESH_NODE"
  topup "callback A" "$CA" "$CALLBACK_FUND" "$THRESH_CALLBACK"
  topup "node B"     "$NB" "$NODE_FUND"     "$THRESH_NODE"
  topup "callback B" "$CB" "$CALLBACK_FUND" "$THRESH_CALLBACK"
  topup "node C"     "$NC" "$NODE_FUND"     "$THRESH_NODE"
  topup "callback C" "$CC" "$CALLBACK_FUND" "$THRESH_CALLBACK"

  echo "Submitted transfers (if any). Waiting a few seconds for confirmations…"
  sleep 8
else
  echo "  - Solana CLI not found locally; skipping automated distribution."
  echo "    You can fund addresses manually and then continue."
  read -p $'\nAfter funding each node and callback address, press Enter to continue…' _
fi

echo "[7/7] Finalizing nodes (init accounts, join cluster, start container)"
run_bootstrap_finalize() {
  local NAME=$1
  local OFFSET=$2
  local IP=$3

  local CLUSTER_EXPORT
  if [[ -n "$CLUSTER_OFFSET" ]]; then
    CLUSTER_EXPORT="export CLUSTER_OFFSET=$CLUSTER_OFFSET;"
  else
    CLUSTER_EXPORT="export CLUSTER_PUBKEY=$CLUSTER_PUBKEY;"
  fi

  gcloud compute ssh "$NAME" --zone "$ZONE" --project "$PROJECT" --command "
    set -e; 
    export PATH=\$HOME/.cargo/bin:\$HOME/.local/bin:/usr/local/bin:\$PATH; 
    # Ensure Docker running for arcup
    sudo systemctl enable --now docker >/dev/null 2>&1 || sudo service docker start >/dev/null 2>&1 || true; 
    for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do sudo docker info >/dev/null 2>&1 && break; sleep 2; done; 
    # Try installing arcium via arcup and ensure it's linked into /usr/local/bin
    if command -v arcup >/dev/null 2>&1 || [ -x \"\$HOME/.local/bin/arcup\" ] || [ -x \"\$HOME/.cargo/bin/arcup\" ]; then 
      arcup install || true; 
      sudo -E env PATH=\"\$HOME/.cargo/bin:\$HOME/.local/bin:/usr/local/bin:\$PATH\" arcup install || true; 
    fi; 
    ARCIUM_BIN=\"\$(sudo env PATH=\"\$HOME/.cargo/bin:\$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:/root/.local/bin:/root/.cargo/bin\" which arcium 2>/dev/null || true)\"; 
    if [ -z \"\$ARCIUM_BIN\" ]; then ARCIUM_BIN=\"\$(sudo find /usr/local/bin /usr/bin /root/.local/bin /root/.cargo/bin -maxdepth 2 -type f -name arcium 2>/dev/null | head -n1)\"; fi; 
    if [ -n \"\$ARCIUM_BIN\" ]; then sudo install -m 0755 \"\$ARCIUM_BIN\" /usr/local/bin/arcium || true; fi; 
    export HELIUS_API_KEY=$HELIUS_API_KEY; 
    $CLUSTER_EXPORT
    export NODE_OFFSET=$OFFSET; 
    export HOST_IP=$IP; 
    export BOOTSTRAP_MODE=finalize; 
    bash ~/bootstrap_arx_node.sh
  " >/dev/null
}

run_bootstrap_finalize "$ARX_NODE_A" "$NODE_OFFSET_A" "$IP_A"
run_bootstrap_finalize "$ARX_NODE_B" "$NODE_OFFSET_B" "$IP_B"
run_bootstrap_finalize "$ARX_NODE_C" "$NODE_OFFSET_C" "$IP_C"

echo "\nQuick health checks (manual on each VM):"
echo "  - arcium arx-info  <OFFSET> --rpc-url \"https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY\""
echo "  - arcium arx-active <OFFSET> --rpc-url \"https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY\""

echo "Done. Submit a job from Flaek Playground to verify finalization."
