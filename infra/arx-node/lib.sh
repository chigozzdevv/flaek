#!/usr/bin/env bash
set -euo pipefail

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$LIB_DIR/../.." && pwd)"
DEFAULT_ENV_FILE="$REPO_ROOT/flaek-server/.env"

env_get() {
  local key="$1"
  local file="${2:-$DEFAULT_ENV_FILE}"
  [[ -f "$file" ]] || return 1
  local line
  line=$(grep -E "^${key}=" "$file" | tail -n1 | cut -d= -f2-)
  line=${line%$'\r'}
  line=${line%$'\n'}
  line=${line#\'}; line=${line%\'}
  line=${line#\"}; line=${line%\"}
  printf '%s' "$line"
}

extract_api_key() {
  local input="$1"
  if [[ -z "$input" ]]; then
    return 0
  fi
  python3 -c "import re, sys; value=sys.argv[1]; match=re.search(r'[?&]api-key=([^&#]+)', value); print(match.group(1) if match else '')" "$input"
}

resolve_manifest_path() {
  if [[ -n "${NODES_FILE:-}" ]]; then
    printf '%s\n' "$NODES_FILE"
    return
  fi
  local candidates=(
    "$LIB_DIR/nodes.json"
    "$LIB_DIR/nodes.sample.json"
  )
  for path in "${candidates[@]}"; do
    if [[ -f "$path" ]]; then
      printf '%s\n' "$path"
      return
    fi
  done
  return 1
}

parse_nodes_manifest() {
  local manifest_path="$1"
  python3 - "$manifest_path" <<PYEND
import json, sys
path = sys.argv[1]
try:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
except FileNotFoundError:
    sys.exit(1)
if not isinstance(data, list):
    raise SystemExit("Manifest must be a JSON array")
for i, item in enumerate(data):
    if not isinstance(item, dict):
        raise SystemExit(f"Node entry #{i+1} must be an object")
    try:
        name = item["name"].strip()
        offset = int(item["offset"])
    except KeyError as exc:
        raise SystemExit(f"Missing required field {exc} in node entry #{i+1}")
    except ValueError:
        raise SystemExit(f"Offset for node '{item.get('name', '?')}' must be numeric")
    ip_name = item.get("ip_name", name).strip()
    machine_type = item.get("machine_type", "e2-standard-4").strip()
    zone = item.get("zone", "us-central1-a").strip()
    region = item.get("region")
    if region:
        region = region.strip()
    else:
        region = zone.rsplit('-', 1)[0]
    ssh_user = item.get("ssh_user", "")
    host_ip = item.get("host_ip", "")
    print("|".join([
        name,
        str(offset),
        ip_name,
        machine_type,
        zone,
        region,
        ssh_user,
        host_ip,
    ]))
PYEND
}

manifest_offsets() {
  local manifest="$1"
  parse_nodes_manifest "$manifest" | cut -d'|' -f2
}

manifest_has_node() {
  local manifest="$1"
  local search_offset="$2"
  parse_nodes_manifest "$manifest" | awk -F'|' -v target="$search_offset" '$2 == target {found=1} END {exit(found?0:1)}'
}
