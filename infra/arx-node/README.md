ARX Node on GCE — 3‑node setup (Devnet)

This folder contains a complete, repeatable way to spin up three ARX nodes on Google Compute Engine and join your existing cluster so computations finalize.

What you get
- `bootstrap_arx_node.sh` — one script that installs Docker + Arcium CLI, generates/funds keys, initializes on‑chain node accounts, joins your cluster, writes config, and starts the container (using `docker run`).
- `node-config.template.toml` — TOML template for reference only. The script writes the actual config per node.
- `docker-compose.yml` — optional. Not required; provided only if you prefer compose.
 - `provision_all.sh` — one-shot orchestrator that uses your repo .env to avoid placeholders.

Prerequisites
- gcloud CLI initialized for project (you already did this).
- 3 static IPs reserved (you already created `arx-node-a/b/c`).
- Firewall rule allowing `tcp:8080` for tag `arx-node` (done).
- A Devnet RPC API key (e.g., Helius). Set `HELIUS_API_KEY`.
- Your Arcium cluster identifier: either `CLUSTER_OFFSET` (preferred) or `CLUSTER_PUBKEY`.

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
- Installs Docker Engine + compose plugin
- Installs Arcium tooling via arcup (`arcium` CLI)
- Installs Solana CLI (used for key gen and airdrops)
- Generates keys if missing: `node-keypair.json`, `callback-kp.json`, `identity.pem`
- Airdrops Devnet SOL to node + callback authorities
- Initializes ARX accounts onchain with your `NODE_OFFSET` and `HOST_IP`
- Joins your cluster (by `CLUSTER_OFFSET` or `CLUSTER_PUBKEY`)
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
- If you only know the cluster account pubkey (e.g. `CaTxK…`), set `CLUSTER_PUBKEY`. If you know the numeric offset, set `CLUSTER_OFFSET` (preferred and supported by all CLI versions).
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
