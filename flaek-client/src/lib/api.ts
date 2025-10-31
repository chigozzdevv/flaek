const API_BASE = import.meta.env.VITE_API_BASE || ''

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('flaek_jwt')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(opts.headers as Record<string, string> || {}),
  }
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    method: opts.method || 'GET',
    headers,
    credentials: 'include',
  })
  const ct = res.headers.get('content-type') || ''
  const body = ct.includes('application/json') ? await res.json() : await res.text()
  if (!res.ok) {
    const message = (body && (body.message || body.error || body.code)) || res.statusText
    throw new Error(typeof message === 'string' ? message : 'Request failed')
  }
  return body
}

// Auth
export async function apiSignup(input: { name: string; email: string; password: string; confirmPassword: string; orgName: string }) {
  return request('/auth/signup', { method: 'POST', body: JSON.stringify(input) }) as Promise<{
    user_id: string; tenant_id: string; totp: { secret_base32: string; otpauth_url: string }
  }>
}

export async function apiVerifyTotp(input: { email: string; code: string }) {
  return request('/auth/verify-totp', { method: 'POST', body: JSON.stringify(input) }) as Promise<{ jwt: string }>
}

export async function apiLogin(input: { email: string; password: string; code?: string }) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(input) }) as Promise<{ jwt: string }>
}

export async function apiRequestPasswordReset(input: { email: string }) {
  await request('/auth/reset-password/request', { method: 'POST', body: JSON.stringify(input) })
  return { ok: true }
}

export async function apiConfirmPasswordReset(input: { token: string; password: string; confirmPassword: string }) {
  await request('/auth/reset-password/confirm', { method: 'POST', body: JSON.stringify(input) })
  return { ok: true }
}

// Tenant
export async function apiGetTenant() {
  return request('/tenants/me') as Promise<{
    tenant_id: string
    org_name: string
    created_at: string
    keys: Array<{ key_id: string; name?: string; created_at: string; revoked_at?: string }>
    balance_cents: number
    plan: string
  }>
}

export async function apiCreateApiKey(input: { name: string }) {
  return request('/tenants/keys', { method: 'POST', body: JSON.stringify(input) }) as Promise<{
    api_key: string
    key_id: string
  }>
}

export async function apiCreatePublishableKey() {
  return request('/tenants/publishable-keys', { method: 'POST' }) as Promise<{
    publishable_key: string
    tenant_public_key: string
  }>
}

export async function apiRevokeApiKey(keyId: string) {
  return request(`/tenants/keys/${keyId}/revoke`, { method: 'POST' })
}

export async function apiGetApiKeys() {
  return request('/tenants/keys') as Promise<{
    items: Array<{
      key_id: string
      name: string
      prefix: string
      created_at: string
      last_used?: string
      status: 'active' | 'revoked'
    }>
  }>
}

export async function apiUpdateTenantName(name: string) {
  return request('/tenants/me', { method: 'PATCH', body: JSON.stringify({ name }) }) as Promise<{
    tenant_id: string
    org_name: string
  }>
}

// User
export async function apiMe() {
  return request('/auth/me') as Promise<{ user: { id: string; name: string; email: string; role: string; totpEnabled: boolean; createdAt: string } }>
}

export async function apiChangePassword(input: { oldPassword: string; newPassword: string; confirmNewPassword: string }) {
  await request('/auth/change-password', { method: 'POST', body: JSON.stringify(input) })
  return { ok: true }
}

export async function apiTotpSetup() {
  return request('/auth/totp/setup', { method: 'POST' }) as Promise<{ totp: { secret_base32: string; otpauth_url: string } }>
}

export async function apiTotpVerifyJwt(code: string) {
  return request('/auth/totp/verify', { method: 'POST', body: JSON.stringify({ code }) }) as Promise<{ enabled: boolean }>
}

export async function apiTotpDisable(code: string) {
  await request('/auth/totp/disable', { method: 'POST', body: JSON.stringify({ code }) })
  return { ok: true }
}

// Datasets
export async function apiGetDatasets() {
  return request('/v1/datasets') as Promise<{
    items: Array<{
      dataset_id: string
      name: string
      created_at: string
      status: 'active' | 'deprecated'
      batch_count?: number
      field_count?: number
      schema?: any
    }>
  }>
}

export async function apiGetDataset(id: string) {
  return request(`/v1/datasets/${id}`) as Promise<{
    dataset_id: string
    name: string
    schema: any
    retention_days: number
    created_at: string
    status: string
    batches: Array<any>
  }>
}

export async function apiCreateDataset(input: { name: string; schema: any }) {
  return request('/v1/datasets', { method: 'POST', body: JSON.stringify(input) }) as Promise<{
    dataset_id: string
  }>
}

export async function apiUpdateDataset(id: string, data: { name?: string; schema?: any }) {
  return request(`/v1/datasets/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function apiDeprecateDataset(id: string) {
  return request(`/v1/datasets/${id}/deprecate`, { method: 'POST' })
}

// Operations
export async function apiGetOperations() {
  return request('/v1/operations') as Promise<{
    items: Array<{
      operation_id: string
      name: string
      version: string
      pipeline_hash: string
      created_at: string
      status: 'active' | 'deprecated'
    }>
  }>
}

export async function apiGetOperation(id: string) {
  return request(`/v1/operations/${id}`) as Promise<{
    operation_id: string
    name: string
    version: string
    pipeline_spec: any
    pipeline_hash: string
    artifact_uri: string
    runtime: string
    inputs: string[]
    outputs: string[]
    status: string
    dataset_id?: string
    dataset?: {
      dataset_id: string
      name: string
      schema: any
    }
    retention_policy?: {
      jobRetentionDays: number
      resultRetentionDays: number
      autoDeleteAfter: boolean
    }
    mxe_program_id?: string
  }>
}

export async function apiCreateOperation(input: {
  name: string
  version: string
  pipeline: any
  mxeProgramId: string
  datasetId?: string
  retentionPolicy?: {
    jobRetentionDays: number
    resultRetentionDays: number
    autoDeleteAfter: boolean
  }
}) {
  return request('/v1/pipelines/operations', { method: 'POST', body: JSON.stringify(input) }) as Promise<any>
}

export async function apiUpdateOperation(id: string, data: { name?: string; version?: string }) {
  return request(`/v1/operations/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function apiDeprecateOperation(id: string) {
  return request(`/v1/operations/${id}/deprecate`, { method: 'POST' })
}

// Jobs
export async function apiGetJobs(params?: { status?: string; limit?: number; cursor?: string; since?: string }) {
  const query = new URLSearchParams(params as any).toString()
  return request(`/v1/jobs${query ? `?${query}` : ''}`) as Promise<{
    items: Array<{
      job_id: string
      dataset_id: string
      operation_id: string
      status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
      created_at: string
      updated_at: string
    }>
    next_cursor?: string
  }>
}

export async function apiGetJob(id: string) {
  return request(`/v1/jobs/${id}`) as Promise<{
    job_id: string
    status: string
    created_at: string
    updated_at: string
    result?: any
    attestation?: {
      provider: string
      pipeline_hash: string
      dataset_hash: string
      signature: string
      timestamp: string
      chain_receipt?: any
    }
    cost?: {
      compute_usd: number
      chain_usd: number
      credits_used: number
    }
  }>
}

export async function apiCreateJob(input: {
  dataset_id: string
  operation: string
  parameters?: any
  inputs?: Array<any>
  encrypted_inputs?: {
    ct0: number[]
    ct1: number[]
    client_public_key: number[]
    nonce: number[] | string
  }
  result_format?: string
  callback_url?: string
}) {
  return request('/v1/jobs', { 
    method: 'POST', 
    body: JSON.stringify(input),
    headers: { 'Idempotency-Key': crypto.randomUUID() }
  }) as Promise<{
    job_id: string
    status: string
    eta_seconds: number
  }>
}

export async function apiCancelJob(id: string) {
  return request(`/v1/jobs/${id}/cancel`, { method: 'POST' }) as Promise<{
    job_id: string
    status: string
  }>
}

// Blocks
export async function apiGetBlocks() {
  return request('/v1/blocks') as Promise<{
    blocks: Array<{
      id: string
      name: string
      category: string
      description: string
      circuit: string
      inputs: Array<any>
      outputs: Array<any>
      icon?: string
      color?: string
      tags?: string[]
    }>
    total: number
  }>
}

export async function apiGetBlock(id: string) {
  return request(`/v1/blocks/${id}`)
}

export async function apiGetBlockCategories() {
  return request('/v1/blocks/categories') as Promise<{
    categories: Array<{ id: string; name: string; count: number }>
  }>
}

// Pipelines
export async function apiValidatePipeline(pipeline: any) {
  return request('/v1/pipelines/validate', { method: 'POST', body: JSON.stringify({ pipeline }) }) as Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
    stats: any
  }>
}

export async function apiTestPipeline(input: { pipeline: any; inputs: any; mxeProgramId?: string }) {
  const body = {
    pipeline: input.pipeline,
    inputs: input.inputs,
    mxeProgramId: input.mxeProgramId || 'BNrnP5CFtszaCymD7rBM776cD62ExLAx4TgpYQJPyvHR',
    dryRun: true,
  }
  const res = await request('/v1/pipelines/execute', { method: 'POST', body: JSON.stringify(body) }) as {
    result: any
    execution: { steps: Array<any>; duration: number; status: string }
  }
  return {
    outputs: res.result,
    steps: res.execution?.steps || [],
    duration: res.execution?.duration || 0,
  }
}

export async function apiGetPipelineTemplates() {
  return request('/v1/pipelines/templates') as Promise<{
    templates: Array<any>
  }>
}

export async function apiGetPipelineDraft() {
  return request('/v1/pipelines/draft') as Promise<{
    draft: { pipeline: any; updatedAt: string } | null
  }>
}

export async function apiSavePipelineDraft(pipeline: any) {
  return request('/v1/pipelines/draft', { method: 'POST', body: JSON.stringify({ pipeline }) }) as Promise<{
    success: boolean
    updatedAt: string
  }>
}

export async function apiDeletePipelineDraft() {
  return request('/v1/pipelines/draft', { method: 'DELETE' }) as Promise<{
    success: boolean
  }>
}

// Webhooks
export async function apiGetWebhooks() {
  return request('/v1/webhooks') as Promise<{
    items: Array<{
      webhook_id: string
      url: string
      events: string[]
      status: 'active' | 'disabled'
      created_at: string
      last_triggered?: string
    }>
  }>
}

export async function apiCreateWebhook(input: { url: string; events: string[] }) {
  return request('/v1/webhooks', { method: 'POST', body: JSON.stringify(input) })
}

export async function apiDeleteWebhook(id: string) {
  return request(`/v1/webhooks/${id}`, { method: 'DELETE' })
}

export async function apiTestWebhook(url: string) {
  return request('/v1/webhooks/test', { method: 'POST', body: JSON.stringify({ url }) }) as Promise<{
    delivered: boolean
  }>
}

// Credits
export async function apiGetCredits() {
  const out = await request('/v1/credits') as { balance_cents: number; plan?: string }
  return { balance: (out.balance_cents || 0) / 100 }
}

// Backward-compatible: map ledger to a transaction-like history with running balance
export async function apiGetCreditHistory(params?: { limit?: number; cursor?: string }) {
  const [balanceRes, ledger] = await Promise.all([
    request('/v1/credits') as Promise<{ balance_cents: number }>,
    apiGetCreditsLedger(params)
  ])
  let running = (balanceRes.balance_cents || 0) / 100
  const items = ledger.items.map((i) => {
    const delta = (i.delta_cents || 0) / 100
    const reason = i.reason || ''
    const type: 'purchase' | 'usage' | 'refund' | 'bonus' = delta >= 0
      ? (reason === 'topup' ? 'purchase' : 'bonus')
      : 'usage'
    const description = reason === 'topup'
      ? 'Top-up'
      : reason === 'job_execution'
        ? (i.job_id ? `Job execution (${i.job_id})` : 'Job execution')
        : reason || 'Adjustment'
    const tx = {
      transaction_id: i.id,
      amount: delta,
      type,
      description,
      balance_after: running,
      created_at: i.created_at,
    }
    running -= delta
    return tx
  })
  return { items }
}

export async function apiTopUpCredits(amount_cents: number) {
  return request('/v1/credits/topup', { method: 'POST', body: JSON.stringify({ amount_cents }) }) as Promise<{
    balance_cents: number
  }>
}

export async function apiGetCreditsLedger(params?: { limit?: number; cursor?: string }) {
  const query = new URLSearchParams(params as any).toString()
  return request(`/v1/credits/ledger${query ? `?${query}` : ''}`) as Promise<{
    items: Array<{
      id: string
      delta_cents: number
      reason: string
      job_id?: string
      created_at: string
    }>
    next_cursor?: string
  }>
}

// Attestations
export async function apiVerifyAttestation(input: { pipeline_hash: string; attestation: any }) {
  return request('/v1/attestations/verify', { method: 'POST', body: JSON.stringify(input) }) as Promise<{
    valid: boolean
  }>
}

export async function apiGetAttestation(jobId: string) {
  return request(`/v1/attestations/${jobId}`)
}

// Public
export async function apiGetMxePublicKey(programId: string) {
  return request(`/v1/public/mxe/${programId}`) as Promise<{ public_key: number[] }>
}
