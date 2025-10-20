#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

usage() {
  cat <<'USAGE'
Usage: cluster-nodes.sh <command> [options]

Commands:
  list                       Show nodes discovered from inventory/manifest
  invite                     Send cluster invitations for nodes
  approve                    Approve pending invites for nodes

Common options:
  --nodes OFF1,OFF2          Comma-separated list of node offsets (defaults to all)
  --cluster-offset OFFSET    Override cluster offset (otherwise read from env/.env)
  --rpc-url URL              Solana RPC URL (defaults to Helium Devnet derived from .env)
  --keypair PATH             Authority keypair (defaults to ~/.config/solana/id.json)
  --inventory PATH           Explicit node inventory CSV (defaults to node-inventory.csv)
  --manifest PATH            Explicit manifest JSON (defaults to lib.sh resolution)
  --yes/-y                   Skip interactive confirmation (for invite/approve)

Examples:
  ./cluster-nodes.sh list
  ./cluster-nodes.sh invite --nodes 81000001,81000002 --yes
  ./cluster-nodes.sh approve --cluster-offset 933394941
USAGE
}

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 1
fi

COMMAND=$1
shift

INVENTORY_PATH="${NODES_SUMMARY:-$SCRIPT_DIR/node-inventory.csv}"
MANIFEST_PATH="$(resolve_manifest_path || true)"

SELECTED_NODES=""
CLUSTER_OFFSET_OVERRIDE=""
RPC_URL_OVERRIDE=""
KEYPAIR_PATH="${KEYPAIR:-$HOME/.config/solana/id.json}"
AUTO_CONFIRM=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --nodes)
      SELECTED_NODES="$2"
      shift 2
      ;;
    --cluster-offset)
      CLUSTER_OFFSET_OVERRIDE="$2"
      shift 2
      ;;
    --rpc-url)
      RPC_URL_OVERRIDE="$2"
      shift 2
      ;;
    --keypair)
      KEYPAIR_PATH="$2"
      shift 2
      ;;
    --inventory)
      INVENTORY_PATH="$2"
      shift 2
      ;;
    --manifest)
      MANIFEST_PATH="$2"
      shift 2
      ;;
    --yes|-y)
      AUTO_CONFIRM=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$MANIFEST_PATH" || ! -f "$MANIFEST_PATH" ]]; then
  MANIFEST_PATH=""
fi

load_nodes() {
  local inventory="$1"
  local manifest="$2"
  python3 - <<'PY' "$inventory" "$manifest"
import csv, json, sys, os
from pathlib import Path

inventory_path = Path(sys.argv[1]) if sys.argv[1] else None
manifest_path = Path(sys.argv[2]) if sys.argv[2] else None

rows = []
if inventory_path and inventory_path.is_file():
    with inventory_path.open(newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                offset = int(row.get('offset', '').strip())
            except ValueError:
                continue
            rows.append({
                'offset': offset,
                'name': row.get('name', '').strip() or f"node-{offset}",
                'ip': row.get('ip', '').strip(),
                'node_pk': row.get('node_pubkey', '').strip(),
                'callback_pk': row.get('callback_pubkey', '').strip(),
            })

if not rows and manifest_path and manifest_path.is_file():
    data = json.loads(manifest_path.read_text())
    if not isinstance(data, list):
        raise SystemExit("Manifest JSON must be a list of node objects")
    for entry in data:
        if not isinstance(entry, dict):
            continue
        name = str(entry.get('name', '')).strip()
        try:
            offset = int(entry['offset'])
        except (KeyError, ValueError):
            continue
        rows.append({
            'offset': offset,
            'name': name or f"node-{offset}",
            'ip': entry.get('host_ip', '') or entry.get('ip', ''),
            'node_pk': '',
            'callback_pk': '',
        })

if not rows:
    raise SystemExit("No nodes found in inventory or manifest")

rows.sort(key=lambda r: r['offset'])
for row in rows:
    print("|".join([
        str(row['offset']),
        row['name'],
        row['ip'] or '',
        row['node_pk'] or '',
        row['callback_pk'] or '',
    ]))
PY
}

mapfile -t NODE_LINES < <(load_nodes "$INVENTORY_PATH" "$MANIFEST_PATH")

declare -a NODE_OFFSETS NODE_NAMES NODE_IPS NODE_PKS NODE_CALLBACK_PKS

for LINE in "${NODE_LINES[@]}"; do
  IFS='|' read -r OFFSET NAME IP NODE_PK CALLBACK_PK <<<"$LINE"
  NODE_OFFSETS+=("$OFFSET")
  NODE_NAMES+=("$NAME")
  NODE_IPS+=("$IP")
  NODE_PKS+=("$NODE_PK")
  NODE_CALLBACK_PKS+=("$CALLBACK_PK")
done

if [[ ${#NODE_OFFSETS[@]} -eq 0 ]]; then
  echo "No nodes available" >&2
  exit 1
fi

filter_offsets=()
if [[ -n "$SELECTED_NODES" ]]; then
  IFS=',' read -r -a filter_offsets <<<"$SELECTED_NODES"
  declare -A wanted
  for off in "${filter_offsets[@]}"; do
    off_trim="${off//[[:space:]]/}"
    if [[ -n "$off_trim" ]]; then
      wanted[$off_trim]=1
    fi
  done
  temp_offsets=()
  temp_names=()
  temp_ips=()
  temp_node_pks=()
  temp_callback_pks=()
  for idx in "${!NODE_OFFSETS[@]}"; do
    off=${NODE_OFFSETS[$idx]}
    if [[ -n "${wanted[$off]:-}" ]]; then
      temp_offsets+=("$off")
      temp_names+=("${NODE_NAMES[$idx]}")
      temp_ips+=("${NODE_IPS[$idx]}")
      temp_node_pks+=("${NODE_PKS[$idx]:-empty}")
      temp_callback_pks+=("${NODE_CALLBACK_PKS[$idx]:-empty}")
    fi
  done
  NODE_OFFSETS=(${temp_offsets[@]:-})
  NODE_NAMES=(${temp_names[@]:-})
  NODE_IPS=(${temp_ips[@]:-})
  NODE_PKS=(${temp_node_pks[@]:-})
  NODE_CALLBACK_PKS=(${temp_callback_pks[@]:-})
fi

if [[ ${#NODE_OFFSETS[@]} -eq 0 ]]; then
  echo "No matching nodes after filtering" >&2
  exit 1
fi

get_cluster_offset() {
  if [[ -n "$CLUSTER_OFFSET_OVERRIDE" ]]; then
    echo "$CLUSTER_OFFSET_OVERRIDE"
    return
  fi
  if [[ -n "$CLUSTER_OFFSET" ]]; then
    echo "$CLUSTER_OFFSET"
    return
  fi
  if OFFSET_FROM_ENV=$(env_get ARCIUM_CLUSTER_OFFSET || true); then
    if [[ -n "$OFFSET_FROM_ENV" ]]; then
      echo "$OFFSET_FROM_ENV"
      return
    fi
  fi
  echo "" >&2
}

get_rpc_url() {
  if [[ -n "$RPC_URL_OVERRIDE" ]]; then
    echo "$RPC_URL_OVERRIDE"
    return
  fi
  echo "https://devnet.helius-rpc.com/?api-key=$HELIUS_API_KEY"
}

confirm() {
  local prompt="$1"
  if $AUTO_CONFIRM; then
    return 0
  fi
  read -p "$prompt (y/N): " -r
  [[ $REPLY =~ ^[Yy]$ ]]
}

cmd_list() {
  printf "%-12s %-18s %-44s %-44s\n" "Offset" "Name" "Node Pubkey" "Callback Pubkey"
  printf '%*s\n' 120 '' | tr ' ' '-'
  for idx in "${!NODE_OFFSETS[@]}"; do
    printf "%-12s %-18s %-44s %-44s\n" \
      "${NODE_OFFSETS[$idx]}" \
      "${NODE_NAMES[$idx]}" \
      "${NODE_PKS[$idx]:-empty}" \
      "${NODE_CALLBACK_PKS[$idx]:-empty}"
  done
}

run_action() {
  local action="$1"
  local cluster_offset
  cluster_offset=$(get_cluster_offset)
  if [[ -z "$cluster_offset" ]]; then
    echo "Cluster offset not specified. Use --cluster-offset or set ARCIUM_CLUSTER_OFFSET." >&2
    exit 1
  fi
  local rpc_url
  rpc_url=$(get_rpc_url)

  echo "Cluster offset: $cluster_offset"
  echo "RPC URL: $rpc_url"
  echo "Authority: $KEYPAIR_PATH"
  echo "Nodes: ${NODE_OFFSETS[*]}"

  if ! confirm "Proceed with $action for ${#NODE_OFFSETS[@]} node(s)?"; then
    echo "Aborted."
    exit 0
  fi

  local successes=0 failures=0
  for idx in "${!NODE_OFFSETS[@]}"; do
    local offset="${NODE_OFFSETS[$idx]}"
    local name="${NODE_NAMES[$idx]}"
    echo "[$offset] $action..."
    if arcium "$action"-join-cluster \
      --cluster-offset "$cluster_offset" \
      --node-offset "$offset" \
      --keypair-path "$KEYPAIR_PATH" \
      --rpc-url "$rpc_url" 2>&1; then
      echo "  ✅ $action succeeded for $offset ($name)"
      ((successes++))
    else
      log_file="/tmp/arx-$action-$offset.log"
      echo "  ❌ $action failed for $offset ($name)"
      ((failures++))
    fi
    echo
  done
  echo "Summary: $successes succeeded, $failures failed"
  if (( failures > 0 )); then
    echo "⚠️  Warning: Some operations failed, but this may be expected if nodes have already been invited/joined."
  fi
}

case "$COMMAND" in
  list)
    cmd_list
    ;;
  invite)
    run_action propose
    ;;
  approve)
    run_action approve
    ;;
  *)
    echo "Unknown command: $COMMAND" >&2
    usage >&2
    exit 1
    ;;
esac
