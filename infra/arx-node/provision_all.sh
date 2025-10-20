#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

PROJECT=${PROJECT:-$(gcloud config get-value project 2>/dev/null || echo "")}
if [[ -z "$PROJECT" ]]; then
  echo "PROJECT not set and no gcloud project configured. Run: gcloud init" >&2
  exit 1
fi

MANIFEST_PATH="${NODES_FILE:-$(resolve_manifest_path || true)}"
if [[ -z "$MANIFEST_PATH" ]]; then
  echo "Provide node manifest via NODES_FILE or create $SCRIPT_DIR/nodes.json" >&2
  exit 1
fi

readarray -t NODE_ROWS < <(parse_nodes_manifest "$MANIFEST_PATH")
if (( ${#NODE_ROWS[@]} == 0 )); then
  echo "Manifest $MANIFEST_PATH does not contain any node definitions" >&2
  exit 1
fi

DEFAULT_REGION=${REGION:-}
DEFAULT_ZONE=${ZONE:-}
DEFAULT_MACHINE=${MACHINE_TYPE:-e2-standard-4}

HELIUS_API_KEY=${HELIUS_API_KEY:-$(extract_api_key "${HELIUS_RPC:-$(env_get HELIUS_RPC || true)}")}
if [[ -z "$HELIUS_API_KEY" ]]; then
  HELIUS_API_KEY=$(extract_api_key "${SOLANA_RPC_URL:-$(env_get SOLANA_RPC_URL || true)}")
fi
if [[ -z "$HELIUS_API_KEY" ]]; then
  echo "HELIUS_API_KEY not provided and could not be derived from .env" >&2
  exit 1
fi

FUNDING_KEYPAIR=${FUNDING_KEYPAIR:-${SOLANA_KEYPAIR:-$HOME/.config/solana/id.json}}
FUNDING_RPC_URL=${FUNDING_RPC_URL:-${SOLANA_RPC_URL:-$(env_get SOLANA_RPC_URL || true)}}
if [[ -z "$FUNDING_RPC_URL" && -n "$HELIUS_API_KEY" ]]; then
  FUNDING_RPC_URL="https://devnet.helius-rpc.com/?api-key=$HELIUS_API_KEY"
fi
NODE_FUND_SOL=${NODE_FUND_SOL:-0}
CALLBACK_FUND_SOL=${CALLBACK_FUND_SOL:-0}

CLUSTER_OFFSET=${CLUSTER_OFFSET:-${ARCIUM_CLUSTER_OFFSET:-$(env_get ARCIUM_CLUSTER_OFFSET || true)}}
CLUSTER_PUBKEY=${CLUSTER_PUBKEY:-${ARCIUM_CLUSTER_PUBKEY:-$(env_get ARCIUM_CLUSTER_PUBKEY || true)}}

if [[ -z "$CLUSTER_OFFSET" && -n "$CLUSTER_PUBKEY" ]]; then
  CLUSTER_OFFSET=$(node -e "try{const {getClusterAccOffset}=require('@arcium-hq/client'); console.log(getClusterAccOffset('$CLUSTER_PUBKEY'))}catch(e){process.exit(1)}" 2>/dev/null || true)
fi
if [[ -z "$CLUSTER_OFFSET" ]]; then
  echo "CLUSTER_OFFSET is required (set ARCIUM_CLUSTER_OFFSET or export CLUSTER_OFFSET)" >&2
  exit 1
fi

echo "Using manifest: $MANIFEST_PATH"
echo "Project: $PROJECT"
echo "Cluster offset: $CLUSTER_OFFSET"

declare -a NODE_ORDER=()
declare -A NODE_OFFSET NODE_IP_NAME NODE_MACHINE NODE_ZONE NODE_REGION NODE_HOST_IP NODE_ADDRESS NODE_NODE_PK NODE_CALLBACK_PK

is_positive() {
  python3 - "$1" <<'PY'
import decimal, sys
try:
    val = decimal.Decimal(sys.argv[1])
except decimal.InvalidOperation:
    sys.exit(1)
sys.exit(0 if val > 0 else 1)
PY
}

fund_account() {
  local recipient="$1"
  local amount="$2"
  local label="$3"
  if [[ -z "$recipient" ]]; then
    return
  fi
  echo "    -> funding $label ($recipient) with ${amount} SOL"
  if ! printf 'y\n' | solana transfer "$recipient" "$amount" --keypair "$FUNDING_KEYPAIR" --url "$FUNDING_RPC_URL" --allow-unfunded-recipient --no-wait >/dev/null 2>&1; then
    echo "       funding $label failed" >&2
  else
    echo "       funded $label"
  fi
}

for ROW in "${NODE_ROWS[@]}"; do
  IFS='|' read -r NAME OFFSET IP_NAME MACHINE ZONE REGION SSH_USER HOST_IP <<< "$ROW"
  if [[ -z "$NAME" || -z "$OFFSET" ]]; then
    echo "Invalid node entry in manifest: $ROW" >&2
    exit 1
  fi
  if [[ -z "$REGION" ]]; then
    if [[ -n "$DEFAULT_REGION" ]]; then
      REGION="$DEFAULT_REGION"
    elif [[ -n "$ZONE" ]]; then
      REGION="${ZONE%-*}"
    fi
  fi
  if [[ -z "$ZONE" ]]; then
    if [[ -n "$DEFAULT_ZONE" ]]; then
      ZONE="$DEFAULT_ZONE"
    elif [[ -n "$REGION" ]]; then
      ZONE="${REGION}-a"
    fi
  fi
  if [[ -z "$REGION" || -z "$ZONE" ]]; then
    echo "Missing zone/region for node $NAME (update manifest or set REGION/ZONE)" >&2
    exit 1
  fi

  NODE_ORDER+=("$NAME")
  NODE_OFFSET["$NAME"]="$OFFSET"
  NODE_IP_NAME["$NAME"]="${IP_NAME:-$NAME}"
  NODE_MACHINE["$NAME"]="${MACHINE:-$DEFAULT_MACHINE}"
  NODE_ZONE["$NAME"]="$ZONE"
  NODE_REGION["$NAME"]="$REGION"
  NODE_HOST_IP["$NAME"]="$HOST_IP"
  NODE_ADDRESS["$NAME"]=""
  NODE_NODE_PK["$NAME"]=""
  NODE_CALLBACK_PK["$NAME"]=""
done

echo "[0.5/7] Ensuring local SSH key exists"
if [[ ! -f "$HOME/.ssh/google_compute_engine" || ! -f "$HOME/.ssh/google_compute_engine.pub" ]]; then
  mkdir -p "$HOME/.ssh" && chmod 700 "$HOME/.ssh"
  ssh-keygen -t rsa -b 4096 -f "$HOME/.ssh/google_compute_engine" -N "" -C "$USER@$(hostname)" >/dev/null
  chmod 600 "$HOME/.ssh/google_compute_engine" || true
fi
gcloud compute config-ssh --quiet --project "$PROJECT" >/dev/null || true

echo "[1/7] Enabling Compute Engine API"
gcloud services enable compute.googleapis.com --project "$PROJECT" >/dev/null || true

echo "[2/7] Ensuring static IPs"
ensure_address() {
  local NAME="$1"
  local REGION="$2"
  if ! gcloud compute addresses describe "$NAME" --region "$REGION" --project "$PROJECT" >/dev/null 2>&1; then
    echo "  - creating address: $NAME ($REGION)"
    gcloud compute addresses create "$NAME" --region "$REGION" --project "$PROJECT" >/dev/null
  else
    echo "  - address exists: $NAME ($REGION)"
  fi
}

for NAME in "${NODE_ORDER[@]}"; do
  region="${NODE_REGION[$NAME]}"
  ip_name="${NODE_IP_NAME[$NAME]}"
  ensure_address "$ip_name" "$region"
  NODE_ADDRESS["$NAME"]="$(gcloud compute addresses describe "$ip_name" --region "$region" --project "$PROJECT" --format='get(address)')"
 done

echo "[3/7] Ensuring firewall rules (8080 http, 8001 peer)"
ensure_rule() {
  local NAME="$1" PORTS="$2"
  if ! gcloud compute firewall-rules describe "$NAME" --project "$PROJECT" >/dev/null 2>&1; then
    gcloud compute firewall-rules create "$NAME" \
      --allow "$PORTS" \
      --target-tags=arx-node \
      --direction=INGRESS \
      --project "$PROJECT" >/dev/null
    echo "  - created firewall rule $NAME ($PORTS)"
  else
    echo "  - firewall rule $NAME exists"
  fi
}

ensure_rule allow-arx-8080 tcp:8080
ensure_rule allow-arx-8001 tcp:8001

IMAGE_FAMILY=${IMAGE_FAMILY:-ubuntu-2204-lts}
IMAGE_PROJECT=${IMAGE_PROJECT:-ubuntu-os-cloud}

echo "[4/7] Ensuring instances"
for NAME in "${NODE_ORDER[@]}"; do
  zone="${NODE_ZONE[$NAME]}"
  machine="${NODE_MACHINE[$NAME]}"
  address="${NODE_ADDRESS[$NAME]}"
  if ! gcloud compute instances describe "$NAME" --zone "$zone" --project "$PROJECT" >/dev/null 2>&1; then
    echo "  - creating instance: $NAME ($zone)"
    gcloud compute instances create "$NAME" \
      --zone "$zone" \
      --machine-type "$machine" \
      --image-family "$IMAGE_FAMILY" \
      --image-project "$IMAGE_PROJECT" \
      --address "$address" \
      --tags arx-node \
      --project "$PROJECT" >/dev/null
  else
    echo "  - instance exists: $NAME"
  fi
 done

SCRIPT_PATH="$SCRIPT_DIR/bootstrap_arx_node.sh"
if [[ ! -f "$SCRIPT_PATH" ]]; then
  echo "bootstrap_arx_node.sh not found in $SCRIPT_DIR" >&2
  exit 1
fi

echo "[5/7] Uploading bootstrap script"
wait_for_ssh() {
  local NAME="$1"
  local ZONE="$2"
  local ATTEMPTS="${WAIT_SSH_ATTEMPTS:-30}"
  local DELAY="${WAIT_SSH_DELAY:-10}"
  local i=1
  while (( i <= ATTEMPTS )); do
    if gcloud compute ssh "$NAME" --zone "$ZONE" --project "$PROJECT" --command 'true' >/dev/null 2>&1; then
      return 0
    fi
    echo "  - waiting for SSH on $NAME ($i/$ATTEMPTS)"
    sleep "$DELAY"
    ((i++))
  done
  return 1
}

scp_with_retry() {
  local SRC="$1" DST_NAME="$2" ZONE="$3"
  local ATTEMPTS="${SCP_ATTEMPTS:-5}"
  local DELAY="${SCP_RETRY_DELAY:-5}"
  local i=1
  while (( i <= ATTEMPTS )); do
    if gcloud compute scp "$SRC" "$DST_NAME":~/ --zone "$ZONE" --project "$PROJECT" >/dev/null 2>&1; then
      return 0
    fi
    echo "  - scp retry to $DST_NAME ($i/$ATTEMPTS)"
    sleep "$DELAY"
    ((i++))
  done
  return 1
}

for NAME in "${NODE_ORDER[@]}"; do
  zone="${NODE_ZONE[$NAME]}"
  echo "  - ensuring SSH is ready: $NAME"
  if ! wait_for_ssh "$NAME" "$zone"; then
    echo "ERROR: SSH not ready for $NAME after waiting. You can increase WAIT_SSH_ATTEMPTS/WAIT_SSH_DELAY." >&2
    exit 1
  fi
  echo "  - uploading bootstrap to $NAME"
  if ! scp_with_retry "$SCRIPT_PATH" "$NAME" "$zone"; then
    echo "ERROR: Failed to upload bootstrap script to $NAME after retries." >&2
    exit 1
  fi
  # also upload shared helpers expected by bootstrap script
  if ! scp_with_retry "$SCRIPT_DIR/lib.sh" "$NAME" "$zone"; then
    echo "ERROR: Failed to upload lib.sh to $NAME after retries." >&2
    exit 1
  fi
done

run_bootstrap() {
  local NAME="$1"
  local MODE="$2"
  local OFFSET="${NODE_OFFSET[$NAME]}"
  local ZONE="${NODE_ZONE[$NAME]}"
  local HOST_IP_VALUE="${NODE_HOST_IP[$NAME]}"
  local ADDRESS="${NODE_ADDRESS[$NAME]}"
  if [[ -z "$HOST_IP_VALUE" ]]; then
    HOST_IP_VALUE="$ADDRESS"
  fi
  local CLUSTER_EXPORT="export CLUSTER_OFFSET=$CLUSTER_OFFSET;"
  echo "    -> $NAME ($MODE)"
  gcloud compute ssh "$NAME" --zone "$ZONE" --project "$PROJECT" --command "
    export HELIUS_API_KEY=$HELIUS_API_KEY
    $CLUSTER_EXPORT
    export NODE_OFFSET=$OFFSET
    export HOST_IP=$HOST_IP_VALUE
    export BOOTSTRAP_MODE=$MODE
    bash ~/bootstrap_arx_node.sh
  " >/dev/null
}

echo "[6/7] Running bootstrap prepare"
for NAME in "${NODE_ORDER[@]}"; do
  run_bootstrap "$NAME" "prepare"
 done

echo "[6.5/7] Collecting node keys"
get_keys_with_retry() {
  local NAME="$1" ZONE="$2"
  local ATTEMPTS="${KEYS_ATTEMPTS:-10}"
  local DELAY="${KEYS_DELAY:-6}"
  local i=1 out="" NODE_PK="" CALLBACK_PK=""
  while (( i <= ATTEMPTS )); do
    out=$(gcloud compute ssh "$NAME" --zone "$ZONE" --project "$PROJECT" --command '
      export PATH=$HOME/.local/share/solana/install/active_release/bin:$HOME/.local/bin:$PATH
      if command -v solana >/dev/null 2>&1; then
        NODE=$(solana address --keypair node-keypair.json 2>/dev/null || true)
        CALLBACK=$(solana address --keypair callback-kp.json 2>/dev/null || true)
        printf "%s %s" "$NODE" "$CALLBACK"
      else
        printf " "
      fi
    ' 2>/dev/null || true)
    NODE_PK=${out%% *}
    CALLBACK_PK=${out#* }
    if [[ -n "$NODE_PK" || -n "$CALLBACK_PK" ]]; then
      printf '%s\n' "$NODE_PK|$CALLBACK_PK"
      return 0
    fi
    echo "  - waiting for keys on $NAME ($i/$ATTEMPTS)"
    sleep "$DELAY"
    ((i++))
  done
  printf '%s\n' "|"
  return 0
}

for NAME in "${NODE_ORDER[@]}"; do
  zone="${NODE_ZONE[$NAME]}"
  IFS='|' read -r NODE_PK CALLBACK_PK < <(get_keys_with_retry "$NAME" "$zone")
  NODE_NODE_PK["$NAME"]="$NODE_PK"
  NODE_CALLBACK_PK["$NAME"]="$CALLBACK_PK"
done

funding_possible=true
if [[ ! -f "$FUNDING_KEYPAIR" ]]; then
  echo "Funding keypair $FUNDING_KEYPAIR not found; skipping funding step" >&2
  funding_possible=false
fi
if [[ -z "$FUNDING_RPC_URL" ]]; then
  echo "FUNDING_RPC_URL not provided; skipping funding step" >&2
  funding_possible=false
fi

if $funding_possible && command -v solana >/dev/null 2>&1; then
  node_fund=false
  callback_fund=false
  if is_positive "$NODE_FUND_SOL"; then node_fund=true; fi
  if is_positive "$CALLBACK_FUND_SOL"; then callback_fund=true; fi
  if $node_fund || $callback_fund; then
    echo "[6.75/7] Funding node accounts"
    for NAME in "${NODE_ORDER[@]}"; do
      if $node_fund; then
        fund_account "${NODE_NODE_PK[$NAME]}" "$NODE_FUND_SOL" "${NAME} node"
      fi
      if $callback_fund; then
        fund_account "${NODE_CALLBACK_PK[$NAME]}" "$CALLBACK_FUND_SOL" "${NAME} callback"
      fi
    done
  fi
fi

echo "[7/7] Running bootstrap finalize"
for NAME in "${NODE_ORDER[@]}"; do
  run_bootstrap "$NAME" "finalize"
 done

SUMMARY_PATH=${NODES_SUMMARY:-"$SCRIPT_DIR/node-inventory.csv"}
{
  echo "name,offset,ip,node_pubkey,callback_pubkey"
  for NAME in "${NODE_ORDER[@]}"; do
    printf "%s,%s,%s,%s,%s\n" \
      "$NAME" \
      "${NODE_OFFSET[$NAME]}" \
      "${NODE_ADDRESS[$NAME]}" \
      "${NODE_NODE_PK[$NAME]}" \
      "${NODE_CALLBACK_PK[$NAME]}"
  done
} > "$SUMMARY_PATH"

echo
printf "Node summary written to %s\n" "$SUMMARY_PATH"
echo "Invite and approve these offsets against cluster $CLUSTER_OFFSET before queuing computations."
