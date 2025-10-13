import 'express-serve-static-core'
import type { TenantDocument } from '@/features/tenants/tenant.model'
import type { AuthClaims } from '@/middlewares/jwt-auth'

declare module 'express-serve-static-core' {
  interface Request {
    tenantId?: string
    tenant?: TenantDocument
    user?: AuthClaims
  }
}
