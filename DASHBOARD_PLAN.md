# Flaek Dashboard Plan

## Overview
Dashboard for managing encrypted compute operations on Arcium. User has completed landing page and auth flows. Backend has full implementation of datasets, operations, jobs, blocks, pipelines, credits, webhooks, and attestations.

---

## Architecture

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│ Top Bar (Logo, Tenant Selector, Credits, User) │
├──────┬──────────────────────────────────────────┤
│      │                                          │
│ Side │         Main Content Area                │
│ Nav  │                                          │
│      │                                          │
│      │                                          │
└──────┴──────────────────────────────────────────┘
```

### Navigation Structure

**Primary Navigation (Sidebar)**
1. **Overview** - Dashboard home
2. **Datasets** - Manage data schemas
3. **Pipeline Builder** - Visual pipeline editor
4. **Operations** - Published pipelines
5. **Jobs** - Execution history & monitoring
6. **Blocks Library** - Browse available circuits
7. **API Keys** - Key management
8. **Webhooks** - Callback configuration
9. **Credits & Billing** - Usage & top-up
10. **Documentation** - API reference

**Secondary Navigation (Top Bar)**
- Tenant/Org switcher (if multiple orgs)
- Credits balance with quick top-up
- User menu (profile, settings, logout)

---

## Page Breakdown

### 1. Overview (Dashboard Home)
**Purpose**: Quick status overview and getting started

**Sections**:
- **Quick Stats Cards**
  - Total jobs (last 30 days)
  - Active operations
  - Credit balance
  - Success rate

- **Recent Activity**
  - Last 10 jobs with status
  - Quick re-run action
  - View details link

- **Quick Actions**
  - Create dataset
  - Build pipeline
  - Run job
  - View docs

- **Getting Started Checklist** (for new users)
  - [ ] Create first dataset
  - [ ] Build a pipeline
  - [ ] Publish operation
  - [ ] Run first job

---

### 2. Datasets
**Purpose**: Define and manage data schemas for jobs

**Features**:
- **List View**
  - Table: Name, Schema Fields, Jobs Count, Created, Status
  - Search & filter
  - Actions: View, Edit, Deprecate, Delete

- **Create/Edit Dataset Modal**
  - Dataset name
  - Dynamic field builder:
    - Field name
    - Type: u8, u16, u32, u64, bool, array, struct
    - Required checkbox
    - Min/max constraints
    - Default value
  - Retention days
  - JSON Schema preview (read-only)

- **Dataset Detail View**
  - Schema visualization
  - Batch history (if using ingest)
  - Jobs using this dataset
  - Sample data format
  - Ingest endpoint & curl example

**Data Model**: `DatasetModel`
```typescript
{
  name: string
  schema: JSONSchema  // Zod-validated
  retentionDays: number
  batches: Array<{ batchId, url, sha256, rows, createdAt }>
  status: 'active' | 'deprecated'
}
```

---

### 3. Pipeline Builder
**Purpose**: Visual flow-based editor for building encrypted compute pipelines

**Features**:
- **Canvas**
  - Drag-and-drop blocks from library
  - Connect blocks with edges
  - Input/output nodes
  - Real-time validation

- **Left Sidebar - Blocks Palette**
  - Categories:
    - Math (add, subtract, multiply, divide, modulo, power, abs_diff)
    - Comparison (gt, lt, eq, gte, lte)
    - Logical (and, or, not, xor)
    - Statistical (mean, median, sum, count)
    - Control Flow (if_else)
    - Use Cases (credit_score, health_risk, fraud_check)
  - Search blocks
  - Block preview with inputs/outputs

- **Right Sidebar - Block Inspector**
  - Selected block details
  - Configure inputs (hardcode values or connect)
  - View outputs
  - Block documentation

- **Top Toolbar**
  - Save pipeline
  - Validate pipeline
  - Test run (with sample inputs)
  - Publish as operation
  - Templates dropdown

- **Templates**
  - Credit score calculation
  - Health risk assessment
  - Conditional pricing
  - Custom blank

**Node Types**:
- **Input Node**: Maps to dataset field
- **Block Node**: Arcium circuit (from BLOCKS_REGISTRY)
- **Output Node**: Result field

**Data Model**: `PipelineDefinition`
```typescript
{
  nodes: Array<{
    id: string
    type: 'input' | 'block' | 'output'
    blockId?: string  // if type=block
    data?: { fieldName?: string, hardcodedValues?: any }
    position: { x, y }
  }>
  edges: Array<{
    id: string
    source: nodeId
    target: nodeId
    sourceHandle: string  // output name
    targetHandle: string  // input name
  }>
}
```

---

### 4. Operations
**Purpose**: Manage published pipelines ready for execution

**Features**:
- **List View**
  - Table: Name, Version, Pipeline Hash, Runtime, Jobs Count, Created, Status
  - Search by name/hash
  - Filter by status
  - Actions: View, Run, Deprecate

- **Operation Detail View**
  - Pipeline visualization (read-only)
  - Metadata:
    - Pipeline hash (verifiable)
    - MXE Program ID
    - Artifact URI
    - Inputs/outputs list
  - Execution history (jobs)
  - Quick run form
  - cURL example
  - SDK code snippet (JS/Python)

- **Create Operation** (from pipeline)
  - Auto-filled from pipeline builder
  - Name & version
  - MXE Program ID
  - Confirm publish

**Data Model**: `OperationModel`
```typescript
{
  name: string
  version: string
  pipelineSpec: any
  pipelineHash: string  // sha256 of spec + artifact
  artifactUri: string
  runtime: 'arcium'
  inputs: string[]
  outputs: string[]
  mxeProgramId: string
  compDefOffset?: number
  status: 'active' | 'deprecated'
}
```

---

### 5. Jobs
**Purpose**: Monitor and manage job executions

**Features**:
- **List View**
  - Table: Job ID, Dataset, Operation, Status, Result, Cost, Created
  - Status badges: queued, running, completed, failed, cancelled
  - Real-time updates (polling or WebSocket)
  - Filters: status, operation, date range
  - Pagination & cursor-based loading

- **Job Detail View**
  - Status timeline
  - Input data (if inline, or dataset ref)
  - Result preview
  - Attestation card:
    - Provider (Arcium)
    - Pipeline hash
    - Signature
    - Timestamp
    - Chain receipt (if anchored on Solana)
    - Verify button
  - Execution metadata:
    - MXE Program ID
    - Computation offset
    - Duration
  - Cost breakdown:
    - Compute cost
    - Chain cost
    - Credits used
  - Actions:
    - Re-run with same inputs
    - Download result (JSON)
    - Copy job ID
    - Cancel (if queued)

- **Create Job Modal**
  - Select dataset
  - Select operation
  - Input mode:
    - Inline: JSON editor for inputs
    - Batch: Select from dataset batches
  - Parameters (optional)
  - Callback URL (optional)
  - Preview request

**Data Model**: `JobModel`
```typescript
{
  datasetId: string
  operationId: string
  source: { type: 'inline', rows: any[] } | { type: 'retained', url: string }
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  result?: any
  attestation?: {
    provider: 'arcium'
    pipelineHash: string
    signature: string
    timestamp: string
    chainReceipt?: { network: 'solana', tx: string, batchRoot: string }
  }
  cost?: { compute_usd, chain_usd, credits_used }
}
```

---

### 6. Blocks Library
**Purpose**: Browse and understand available Arcium circuits

**Features**:
- **Grid/List View**
  - Category tabs: All, Math, Comparison, Logical, Statistical, Use Cases
  - Search by name/description
  - Cards with:
    - Icon & color
    - Name & description
    - Input/output types
    - Tags

- **Block Detail Modal**
  - Full description
  - Inputs table (name, type, required, constraints)
  - Outputs table (name, type, description)
  - Circuit name & compDefOffset
  - Examples (if available)
  - Usage count (how many pipelines use it)
  - "Add to pipeline" button (if in builder)

**Data Source**: `BLOCKS_REGISTRY` (static, from backend)

---

### 7. API Keys
**Purpose**: Manage authentication keys

**Features**:
- **Publishable Keys Card**
  - Display publishable key
  - Display tenant public key
  - Embed snippet for client-side encryption
  - Regenerate button

- **API Keys List**
  - Table: Name, Prefix (flaek_sk_...), Created, Last Used, Status
  - Actions: Copy, Revoke

- **Create API Key**
  - Name (e.g., "production", "staging")
  - Shows full key once (never again)
  - Copy to clipboard

- **Security Notice**
  - Keys are hashed, never stored plaintext
  - Revoked keys stop working immediately

---

### 8. Webhooks
**Purpose**: Configure job result callbacks

**Features**:
- **Webhook Configuration**
  - Callback URL input
  - Test webhook button (sends sample payload)
  - Delivery log (last 50 deliveries)
  - Retry policy settings

- **Webhook Secret**
  - Display current secret
  - Regenerate button
  - HMAC validation guide

- **Event Log**
  - Table: Job ID, Status, Delivered, HTTP Status, Timestamp
  - Retry action

---

### 9. Credits & Billing
**Purpose**: Manage account balance and view usage

**Features**:
- **Balance Card**
  - Current balance (in USD cents)
  - Plan name
  - Top-up button

- **Top-Up Modal**
  - Amount input
  - Payment method (future: Stripe integration)
  - Current balance preview

- **Ledger Table**
  - Date, Description, Amount (delta), Job ID, Balance After
  - Filter by type: charge, top-up, refund
  - Export CSV

- **Usage Stats**
  - Chart: daily spend (last 30 days)
  - Breakdown by operation

---

### 10. Settings (Future)
- **Profile**: Name, email, 2FA settings
- **Organization**: Members, roles, invitations
- **Notifications**: Email preferences
- **Security**: API key rotation, audit log

---

## UI Component Library

### Core Components
1. **DashboardLayout** - Shell with sidebar and top bar
2. **Sidebar** - Navigation with active state
3. **TopBar** - Tenant selector, credits, user menu
4. **Card** - Container for sections
5. **Table** - Sortable, filterable data table
6. **Modal** - For create/edit forms
7. **Button** - Primary, secondary, ghost, danger variants
8. **Badge** - Status indicators
9. **CodeBlock** - Syntax-highlighted code snippets
10. **EmptyState** - Friendly placeholder for empty lists
11. **LoadingSpinner** - Async states
12. **Toast** - Notifications
13. **JsonEditor** - For inline job inputs

### Pipeline Builder Components
1. **ReactFlowCanvas** - Use react-flow or xyflow
2. **BlockNode** - Custom node component
3. **InputNode** - Dataset field input
4. **OutputNode** - Result output
5. **BlocksPalette** - Draggable blocks list
6. **BlockInspector** - Right panel for config
7. **PipelineToolbar** - Save, validate, test, publish

---

## Data Flow

### Job Execution Flow
1. User creates dataset with schema
2. User builds pipeline in visual editor
3. User publishes pipeline as operation (generates hash)
4. User submits job with inputs
5. Backend validates inputs against schema
6. Worker submits to Arcium with pipeline hash
7. Arcium executes in encrypted environment
8. Result + attestation returned
9. User sees result in dashboard
10. Optional: Webhook fired to callback URL

### Authentication Flow
1. User signs in → JWT stored in localStorage
2. JWT sent as Bearer token to API
3. Backend validates JWT, extracts tenantId
4. All resources scoped to tenant

---

## Technology Stack (Client)

**Framework**: React 19 + TypeScript
**Styling**: TailwindCSS 4
**UI Components**: Custom (existing Button, etc.) + additions needed
**Icons**: Lucide React
**Pipeline Builder**: React Flow (xyflow)
**Routing**: Custom (existing router.ts)
**State Management**: React hooks + Context (for auth state)
**API Client**: Fetch (existing api.ts)
**Animations**: Framer Motion

---

## Implementation Phases

### Phase 1: Core Dashboard Shell
- [ ] Dashboard layout component
- [ ] Sidebar navigation
- [ ] Top bar with user/credits
- [ ] Overview page with stats
- [ ] Protected routes (JWT check)

### Phase 2: Dataset Management
- [ ] Dataset list view
- [ ] Create dataset form with dynamic fields
- [ ] Dataset detail view
- [ ] Schema validation preview

### Phase 3: Pipeline Builder (MVP)
- [ ] React Flow canvas setup
- [ ] Blocks palette from API
- [ ] Drag-and-drop blocks
- [ ] Connect edges
- [ ] Save pipeline
- [ ] Basic validation

### Phase 4: Operations & Jobs
- [ ] Operations list & detail
- [ ] Create operation from pipeline
- [ ] Jobs list with real-time status
- [ ] Job detail with attestation
- [ ] Run job modal

### Phase 5: Polish & Extensions
- [ ] Blocks library page
- [ ] API keys management
- [ ] Webhooks config
- [ ] Credits & billing
- [ ] Pipeline templates
- [ ] Test run in builder

---

## API Integration Map

| Page | Endpoints Used |
|------|----------------|
| Overview | `GET /v1/datasets`, `GET /v1/operations`, `GET /v1/jobs?limit=10`, `GET /v1/credits` |
| Datasets | `GET /v1/datasets`, `POST /v1/datasets`, `GET /v1/datasets/:id`, `POST /v1/datasets/:id/deprecate` |
| Pipeline Builder | `GET /v1/blocks`, `POST /v1/pipelines/validate`, `POST /v1/pipelines/test`, `POST /v1/operations` |
| Operations | `GET /v1/operations`, `GET /v1/operations/:id`, `POST /v1/operations/:id/deprecate` |
| Jobs | `GET /v1/jobs`, `POST /v1/jobs`, `GET /v1/jobs/:id`, `POST /v1/jobs/:id/cancel` |
| Blocks | `GET /v1/blocks`, `GET /v1/blocks/:id`, `GET /v1/blocks/categories` |
| API Keys | `GET /tenants/me`, `POST /tenants/keys`, `POST /tenants/publishable-keys`, `POST /tenants/keys/:id/revoke` |
| Webhooks | `POST /v1/webhooks/test`, webhook config stored in job submission |
| Credits | `GET /v1/credits`, `POST /v1/credits/topup`, `GET /v1/credits/ledger` |

---

## Design System

### Colors (from existing landing page)
- **Brand**: `#6366F1` (indigo)
- **Success**: `#10B981` (green)
- **Warning**: `#F59E0B` (amber)
- **Danger**: `#EF4444` (red)
- **Info**: `#3B82F6` (blue)
- **Background**: `#09090B` (dark)
- **Card**: `bg-white/[0.03]` with `border-white/10`
- **Text**: `text-white`, `text-white/70` (muted)

### Typography
- **Headings**: `font-bold`, `tracking-tight`
- **Body**: `text-base`, `leading-relaxed`
- **Code**: `font-mono`, `text-sm`

### Spacing
- **Cards**: `p-6` or `p-8`
- **Sections**: `mb-8` or `mb-12`
- **Forms**: `space-y-4` or `space-y-6`

### Animations
- **Transitions**: `transition-all duration-200`
- **Hover states**: `hover:` effects on interactive elements
- **Loading states**: Shimmer or spinner

---

## Security Considerations

1. **JWT Validation**: Check token on every protected route
2. **API Key Display**: Show full key only once on creation
3. **Input Sanitization**: Validate all user inputs client-side before API call
4. **CORS**: Backend already configured
5. **Attestation Verification**: Provide UI for users to verify signatures
6. **Webhook Secrets**: Never log full secrets

---

## User Flows

### First-Time User Journey
1. Sign up → 2FA setup
2. Land on Overview with empty state
3. See getting started checklist
4. Click "Create first dataset" → modal → success
5. Click "Build a pipeline" → opens builder with template suggestion
6. Select template (e.g., credit score) → loads pre-built pipeline
7. Click "Publish as operation" → prompts for name/version
8. Click "Run first job" → modal to input test data
9. Job submitted → redirected to Jobs page
10. See job status → completed → view attestation
11. Checkmarks appear on overview

### Power User Flow (Existing User)
1. Sign in → lands on Overview
2. Sees recent jobs and stats
3. Clicks "Pipeline Builder" from sidebar
4. Builds complex multi-block pipeline
5. Tests with sample data inline
6. Publishes as versioned operation
7. Goes to Operations → copies cURL example
8. Uses in their application backend
9. Monitors jobs in Jobs page
10. Checks credits usage in Billing

---

## Next Steps

1. **Confirm Layout**: Does this structure match your vision?
2. **Prioritize Features**: Which pages/features to build first?
3. **Design Mockups**: Want to see visual mockups for key pages?
4. **Start Implementation**: Begin with Phase 1 (core shell)?

---

## Notes

- Backend is production-ready with all endpoints implemented
- Blocks registry has 20+ circuits across categories
- Pipeline engine supports topological sort and execution
- Jobs support inline inputs and dataset batches
- Attestations include Arcium signatures and optional Solana anchoring
- Credits system is ready (ledger, top-up, deduction)
- 2FA is enforced for all new signups

This dashboard will be the control center for users to harness encrypted compute on Arcium through Flaek's platform. 🚀
