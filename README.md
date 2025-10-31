# Flaek

Flaek lets you build and run private computations on encrypted data. Imagine drawing a flowchart of building blocks (add, compare, threshold, domain blocks like credit_score) and having it run end‑to‑end on the Arcium MPC network, so inputs stay encrypted and only the right parties can decrypt the outputs.

At a glance:
- flaek-server: TypeScript/Express API that manages tenants, datasets, pipelines, jobs, credits, attestations, and Arcium execution.
- flaek-client: React/Vite UI to design pipelines and run jobs.
- infra/: helper scripts to provision Arx nodes on GCE when you want your own MPC cluster.

## How to think about it
- Datasets are named collections you’ll compute over (schemas are yours to define).
- Blocks are prebuilt confidential circuits (math/logic/use‑case). You connect them into a pipeline.
- An Operation is a versioned, saved pipeline you can reuse.
- A Job runs an operation with encrypted inputs, queues it to Arcium, and returns results plus an attestation.

## Tech stack
- Server: Node.js, TypeScript, Express 5, MongoDB, Redis/BullMQ, Socket.IO, Zod, Pino. Arcium/Solana via @arcium-hq/* and @solana/web3.js.
- Client: React + Vite + Tailwind, React Flow.
- Infra: bash + gcloud to bootstrap Arx nodes on GCE.

---

## Quick start (local dev)

Prerequisites:
- Node.js 20+
- MongoDB and Redis (local or Docker)

Start dependencies with Docker (recommended):
```bash
docker run --name mongo -p 27017:27017 -d mongo:7
docker run --name redis -p 6379:6379 -d redis:7
```

1) Server setup
```bash
cd flaek-server
npm install
cp .env .env.local # or create .env from the template below
# Edit .env to match your local services
npm run dev
# Server listens on http://localhost:4000 by default
```

2) Client setup
```bash
cd ../flaek-client
npm install
cp .env.example .env
echo "VITE_API_BASE=http://localhost:4000" > .env
npm run dev
# UI on http://localhost:5173
```

Login flow (first run):
1. POST /auth/signup to create owner and tenant; you’ll receive a TOTP secret/URL.
2. POST /auth/verify-totp with the 6‑digit code.
3. POST /auth/login to get a JWT; or create an API key and use that as the Bearer token.

Minimal examples:
```bash
# 1) Signup
curl -X POST http://localhost:4000/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","password":"passpass","confirmPassword":"passpass","orgName":"Ada Labs"}'

# 2) Verify TOTP
curl -X POST http://localhost:4000/auth/verify-totp \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","code":"123456"}'

# 3) Login (returns { jwt })
curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"passpass","code":"123456"}'

# 4) Create an API key (optional; use as Bearer token)
curl -X POST http://localhost:4000/tenants/keys \
  -H 'Authorization: Bearer YOUR_JWT' -H 'Content-Type: application/json' -d '{"name":"default"}'
```

---

## Configuration

Server environment (.env) — required keys
```bash
# Base
NODE_ENV=development
PORT=4000

# Datastores
MONGO_URI=mongodb://localhost:27017/flaek
REDIS_URL=redis://localhost:6379

# Auth & security
JWT_SECRET=replace-with-long-random
JWT_EXPIRES_IN=7d
WEBHOOK_SECRET=replace-with-long-random
API_KEY_HASH_SALT=replace-with-long-random
JOB_ENC_KEY=replace-with-32+chars
INGEST_TTL_SECONDS=3600

# Cloudinary (used for object storage/assets)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Solana / Arcium
SOLANA_RPC_URL=https://api.devnet.solana.com # or your RPC (e.g. Helius URL)
# JSON array of 64-byte secret key (solana-keygen new -o id.json; use contents)
ARCIUM_SOLANA_SECRET_KEY=[1,2,3,...]

# Optional — let server prefill Arcium accounts
ARCIUM_MXE_PUBLIC_KEY=...
ARCIUM_CLUSTER_PUBKEY=...
```

Client environment (.env)
```bash
VITE_API_BASE=http://localhost:4000
```

Notes:
- The server validates env on boot (Zod). Missing values will fail fast.
- ARCIUM_SOLANA_SECRET_KEY is the JSON from a Solana keypair (not base58); used for anchoring and MXE ops.

---

## Using the API

Authentication options:
- Bearer JWT (owner user): Authorization: Bearer <JWT>
- Bearer API key (tenant scope): Authorization: Bearer <API_KEY>

Create a dataset
```bash
curl -X POST http://localhost:4000/v1/datasets \
  -H 'Authorization: Bearer <TOKEN>' -H 'Content-Type: application/json' \
  -d '{"name":"customers","schema":{"fields":[{"name":"age","type":"u8"}]}}'
```

Explore blocks and templates
```bash
curl http://localhost:4000/v1/blocks            # list blocks
curl http://localhost:4000/v1/pipelines/templates # sample pipelines
```

Create an operation from a template
```bash
TEMPLATE=$(curl -s http://localhost:4000/v1/pipelines/templates | jq -c '.templates[0].pipeline')
curl -X POST http://localhost:4000/v1/pipelines/operations \
  -H 'Authorization: Bearer <TOKEN>' -H 'Content-Type: application/json' \
  -d '{
    "name":"demo-op","version":"1.0.0",
    "mxeProgramId":"BNrnP5CFtszaCymD7rBM776cD62ExLAx4TgpYQJPyvHR",
    "pipeline":'"$TEMPLATE"'
  }'
```

Dry‑run a pipeline (no job, plaintext inputs)
```bash
curl -X POST http://localhost:4000/v1/pipelines/execute \
  -H 'Authorization: Bearer <TOKEN>' -H 'Content-Type: application/json' \
  -d '{
    "mxeProgramId":"BNrnP5CFtszaCymD7rBM776cD62ExLAx4TgpYQJPyvHR",
    "pipeline": {"nodes":[{"id":"a","type":"input","data":{"fieldName":"x"}},
                               {"id":"b","type":"input","data":{"fieldName":"y"}},
                               {"id":"add","blockId":"add"},
                               {"id":"out","type":"output","data":{"fieldName":"result"}}],
                 "edges":[{"id":"e1","source":"a","target":"add","targetHandle":"a"},
                           {"id":"e2","source":"b","target":"add","targetHandle":"b"},
                           {"id":"e3","source":"add","target":"out"}]},
    "inputs": {"x": 10, "y": 32}
  }'
```

Run a confidential job (encrypted inputs)
- Jobs require credits (see Credits below) and client‑side encryption of inputs.
- The server expects:
  ```json
  {
    "dataset_id": "...",
    "operation": "...", 
    "encrypted_inputs": {
      "ct0": [..32 bytes..],
      "ct1": [..32 bytes..],
      "client_public_key": [..32 bytes..],
      "nonce": "base64 or number[]"
    }
  }
  ```
- Use the Arcium TS client to fetch the MXE x25519 public key and produce `ct0/ct1, client_public_key, nonce`. See Arcium docs and the client app’s Playground for a working example.

```bash
curl -X POST http://localhost:4000/v1/jobs \
  -H 'Authorization: Bearer <TOKEN>' -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"dataset_id":"DATASET_ID","operation":"OPERATION_ID","encrypted_inputs":{...}}'
```

Check job status
```bash
curl -H 'Authorization: Bearer <TOKEN>' http://localhost:4000/v1/jobs/JOB_ID
```

Verify attestation
```bash
curl -X POST http://localhost:4000/v1/attestations/verify \
  -H 'Authorization: Bearer <TOKEN>' -H 'Content-Type: application/json' \
  -d '{"jobId":"JOB_ID"}'
```

Credits (simple wallet)
```bash
# Get balance
curl -H 'Authorization: Bearer <TOKEN>' http://localhost:4000/v1/credits
# Top up (cents)
curl -X POST http://localhost:4000/v1/credits/topup \
  -H 'Authorization: Bearer <TOKEN>' -H 'Content-Type: application/json' \
  -d '{"amount_cents": 10000}'
```

---

## Arcium and MXE keys (what’s needed)
- The server talks to Solana and Arcium using `SOLANA_RPC_URL` and `ARCIUM_SOLANA_SECRET_KEY` (a Solana keypair JSON array). For local development, you can use devnet and a local keypair; for full confidential runs you also need a live MXE program and (optionally) your cluster’s public key via `ARCIUM_CLUSTER_PUBKEY`.
- If you’re only exploring the UI and dry‑run execution, the server will still require the env variables, but won’t submit actual on‑chain transactions without a valid key.

Provisioning your own Arx nodes (optional): see `infra/arx-node/README.md` for manifest‑driven bootstrapping on GCE (Docker + arcup). Think of it as “bring your own MPC cluster” when you’re ready.

---

## Troubleshooting
- 401 unauthorized: use `Authorization: Bearer <JWT>` or `Bearer <API_KEY>` depending on endpoint. Unified auth accepts both for most `/v1/*` routes.
- Job creation fails with quota_exceeded: top up credits via `/v1/credits/topup`.
- Missing env on boot: the server validates .env; copy the template above and fill required fields.
- CORS in dev: server allows `http://localhost:5173` by default; set `VITE_API_BASE` to `http://localhost:4000`.
- Mongo/Redis connection errors: ensure services are running and URIs match.

---

## Useful scripts
Server (`flaek-server`):
- `npm run dev` – start API with hot reload.
- `npm run build && npm start` – build to `dist/` and start.
- `npm run worker` – run job worker CLI (workers also start with the server).
- `npm run arcium:*` – helper CLIs (upload circuits, derive accounts, etc.).

Client (`flaek-client`):
- `npm run dev` – run Vite dev server.
- `npm run build` – production build.

---

## What this gives you
Use Flaek to prototype and ship privacy‑preserving features fast: “calculate a credit score without seeing income,” “price a quote without revealing raw inputs,” or “tally a vote without exposing ballots.” You design a pipeline like you’d describe it to a teammate—inputs, a few blocks, an output—and the system handles encryption, queuing, execution, and attestations for you.
