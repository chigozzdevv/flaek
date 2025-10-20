ARX Node on GCE — manifest-driven setup (Devnet)

This folder contains scripts to provision one or more ARX nodes on Google Compute Engine using a JSON manifest and the shared helpers in `lib.sh`.

Tools provided
- `bootstrap_arx_node.sh` — installs Docker and Arcium tooling on a VM, initializes node accounts, and starts the `arcium/arx-node` container.
- `provision_all.sh` — orchestrates VM creation, bootstrapping, and summary output based on a manifest (`nodes.json`).
- `cluster-nodes.sh` — invite/approve helper that reads the generated node inventory.
- `create-new-cluster.sh` — helper to create a new cluster (unchanged).
- `nodes.sample.json` — example manifest for three nodes.

📁 Manifest (`nodes.json`)
```json
[
  { "name": "arx-node-a", "offset": 81000001, "region": "us-central1", "zone": "us-central1-a", "machine_type": "e2-standard-4" },
  { "name": "arx-node-b", "offset": 81000002, "region": "us-central1", "zone": "us-central1-a", "machine_type": "e2-standard-4" },
  { "name": "arx-node-c", "offset": 81000003, "region": "us-central1", "zone": "us-central1-a", "machine_type": "e2-standard-4" }
]
```

📋 Prerequisites
- gcloud CLI configured for your project
- Static IPs reserved per node or let the script create/verify them (`ip_name` defaults to the node name)
- Firewall rule allowing `tcp:8080` tagged `arx-node`
- `HELIUS_API_KEY` (or `SOLANA_RPC_URL` containing an api-key query param)
- `ARCIUM_CLUSTER_OFFSET` (preferred) in `.env` or exported

🚀 Provision all nodes
```bash
export PROJECT=your-gcp-project
export REGION=us-central1      # optional default
export ZONE=us-central1-a      # optional default
export NODES_FILE=infra/arx-node/nodes.json  # optional if using default path
export HELIUS_API_KEY=...      # optional if derived from .env
export CLUSTER_OFFSET=933394941

bash infra/arx-node/provision_all.sh
```

This will:
1. Ensure required IP addresses and firewall rules exist
2. Create/verify instances per manifest entry
3. Upload `bootstrap_arx_node.sh`
4. Run bootstrap in `prepare` (key generation) and `finalize` modes
5. Write `infra/arx-node/node-inventory.csv` with offsets, IPs, and generated pubkeys

🧠 Cluster invitations
Use `cluster-nodes.sh` to manage cluster membership:
```bash
# list discovered nodes
infra/arx-node/cluster-nodes.sh list

# invite nodes (cluster authority keypair) - uses 'propose-join-cluster' CLI command
infra/arx-node/cluster-nodes.sh invite --yes

# Note: 'approve' command is deprecated. The 2-step process is now:
# 1. Cluster authority proposes nodes (via 'invite' above)
# 2. Nodes accept the proposal (this happens automatically in bootstrap script via 'join-cluster true')
```

🛠️ Manual bootstrap (single node)
```bash
gcloud compute ssh arx-node-a --zone us-central1-a --command '
  export HELIUS_API_KEY=...
  export CLUSTER_OFFSET=933394941
  export NODE_OFFSET=81000001
  export HOST_IP=$(curl -s https://api.ipify.org)
  bash ~/bootstrap_arx_node.sh
'
```

🩺 Health checks
```bash
RPC=https://devnet.helius-rpc.com/?api-key=$HELIUS_API_KEY
arcium arx-info  81000001 --rpc-url "$RPC"
arcium arx-active 81000001 --rpc-url "$RPC"
```

📄 Outputs
`provision_all.sh` emits `node-inventory.csv` for reference:
```
name,offset,ip,node_pubkey,callback_pubkey
arx-node-a,81000001,34.123.45.67,H...,C...
...
```

Cluster authority uses those pubkeys with `cluster-nodes.sh invite/approve`.

1) Create the 3 VMs (uses your reserved IPs)

```
REGION=us-central1
ZONE=us-central1-a

IP_A=$(gcloud compute addresses describe arx-node-a --region "$REGION" --format='get(address)')
IP_B=$(gcloud compute addresses describe arx-node-b --region "$REGION" --format='get(address)')
IP_C=$(gcloud compute addresses describe arx-node-c --region "$REGION" --format='get(address)')

gcloud compute instances create arx-node-a \
  --zone "$ZONE" \
  --machine-type e2-standard-4 \
  --image-family debian-12 --image-project debian-cloud \
  --address "$IP_A" \
  --tags arx-node

gcloud compute instances create arx-node-b \
  --zone "$ZONE" \
  --machine-type e2-standard-4 \
  --image-family debian-12 --image-project debian-cloud \
  --address "$IP_B" \
  --tags arx-node

gcloud compute instances create arx-node-c \
  --zone "$ZONE" \
  --machine-type e2-standard-4 \
  --image-family debian-12 --image-project debian-cloud \
  --address "$IP_C" \
  --tags arx-node
```

2) Copy the bootstrap script to each VM

```
gcloud compute scp infra/arx-node/bootstrap_arx_node.sh arx-node-a:~/ --zone "$ZONE"
gcloud compute scp infra/arx-node/bootstrap_arx_node.sh arx-node-b:~/ --zone "$ZONE"
gcloud compute scp infra/arx-node/bootstrap_arx_node.sh arx-node-c:~/ --zone "$ZONE"
```

3a) One‑shot provisioning (reads creds from flaek-server/.env)

The script will auto-detect your Helius API key and cluster pubkey from `flaek-server/.env` (variables `SOLANA_RPC_URL` or `HELIUS_RPC`, and `ARCIUM_CLUSTER_PUBKEY`). You can override via env.

```
export REGION=us-central1
export ZONE=us-central1-a
export NODE_OFFSET_A=71000001 NODE_OFFSET_B=71000002 NODE_OFFSET_C=71000003

bash infra/arx-node/provision_all.sh
```

3b) Run the bootstrap on each VM (non‑interactive; uses docker run)

- Replace placeholders: `YOUR_HELIUS_API_KEY`, your `CLUSTER_OFFSET` (preferred) or `CLUSTER_PUBKEY`.
- Use unique node offsets per VM (example: 71000001/2/3).

```
# Node A
gcloud compute ssh arx-node-a --zone "$ZONE" --command '
  export HELIUS_API_KEY=YOUR_HELIUS_API_KEY; 
  export CLUSTER_OFFSET=YOUR_CLUSTER_OFFSET;        # or: export CLUSTER_PUBKEY=CaTxK...
  export NODE_OFFSET=71000001; 
  export HOST_IP=$(curl -s https://ipecho.net/plain); 
  bash ~/bootstrap_arx_node.sh
'

# Node B
gcloud compute ssh arx-node-b --zone "$ZONE" --command '
  export HELIUS_API_KEY=YOUR_HELIUS_API_KEY; 
  export CLUSTER_OFFSET=YOUR_CLUSTER_OFFSET;        # or: export CLUSTER_PUBKEY=CaTxK...
  export NODE_OFFSET=71000002; 
  export HOST_IP=$(curl -s https://ipecho.net/plain); 
  bash ~/bootstrap_arx_node.sh
'

# Node C
gcloud compute ssh arx-node-c --zone "$ZONE" --command '
  export HELIUS_API_KEY=YOUR_HELIUS_API_KEY; 
  export CLUSTER_OFFSET=YOUR_CLUSTER_OFFSET;        # or: export CLUSTER_PUBKEY=CaTxK...
  export NODE_OFFSET=71000003; 
  export HOST_IP=$(curl -s https://ipecho.net/plain); 
  bash ~/bootstrap_arx_node.sh
'
```

What the bootstrap does
- Installs Docker Engine + compose plugin (Ubuntu/Debian)
- Installs Arcium tooling via arcup (`arcium` CLI)
- Installs Solana CLI (used for key gen and airdrops)
- Generates keys if missing: `node-keypair.json`, `callback-kp.json`, `identity.pem`
- Initializes ARX accounts onchain with your `NODE_OFFSET` and `HOST_IP`
- Joins your cluster (by `CLUSTER_OFFSET`)
- Writes `node-config.toml`
- Starts the `arcium/arx-node` container with `docker run` and tails logs

Health checks
```
RPC="https://devnet.helius-rpc.com/?api-key=$HELIUS_API_KEY"
arcium arx-info  71000001 --rpc-url "$RPC"
arcium arx-active 71000001 --rpc-url "$RPC"
arcium arx-info  71000002 --rpc-url "$RPC"
arcium arx-active 71000002 --rpc-url "$RPC"
arcium arx-info  71000003 --rpc-url "$RPC"
arcium arx-active 71000003 --rpc-url "$RPC"
```

Notes
- If your cluster enforces invitations, the cluster authority must issue invites before `join-cluster` will succeed. Then the bootstrap’s `join-cluster true` will accept them.
- Use `CLUSTER_OFFSET` (preferred by current CLI). `CLUSTER_PUBKEY` is shown only for compatibility.
- If Devnet airdrop throttles, re-run the bootstrap; it’s idempotent.
- Port `8080` is exposed via the `arx-node` network tag you already allowed.

What you already did (keep it)
- Created project and enabled Compute Engine API
- Reserved three static IPs `arx-node-a/b/c`
- Created firewall rule `allow-arx-8080` for tag `arx-node`

Next steps
- Run a job from Flaek Playground again. You should now see `awaitComputationFinalization` succeed and the result decrypt client-side.

Cluster invites (authority side)
- Your nodes cannot join until the cluster authority invites them. The provisioner prints each node’s `offset`, `public IP`, and node/callback pubkeys at the end — pass these to the authority.
- On the authority machine (the one that owns the cluster):
  - Ensure the cluster exists (created via `arcium init-cluster ...`).
  - Invite/approve nodes with offsets `71000001/02/03` using the official Arcium CLI for your version (see Step 7 “Cluster Operations” in `flaek-server/arcium.md`).
  - Once the invite is on-chain, the node-side bootstrap will automatically retry `join-cluster true` every 30s (for ~20 minutes) until it succeeds.
- After invites land, verify on any VM: `arcium arx-active <OFFSET> --rpc-url <devnet RPC>` shows the node as active.
