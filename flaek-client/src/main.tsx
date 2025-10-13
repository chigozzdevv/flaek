import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@/app'
import GetStartedPage from '@/pages/get-started'
import SigninPage from '@/pages/signin'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import OverviewPage from '@/pages/dashboard/overview'
import DatasetsPage from '@/pages/dashboard/datasets'
import PipelineBuilderPage from '@/pages/dashboard/pipeline-builder'
import OperationsPage from '@/pages/dashboard/operations'
import JobsPage from '@/pages/dashboard/jobs'
import BlocksPage from '@/pages/dashboard/blocks'
import ApiKeysPage from '@/pages/dashboard/api-keys'
import WebhooksPage from '@/pages/dashboard/webhooks'
import CreditsPage from '@/pages/dashboard/credits'

function usePathname() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}

function Router() {
  const path = usePathname()
  
  if (path === '/get-started') return <GetStartedPage />
  if (path === '/signin') return <SigninPage />
  
  if (path.startsWith('/dashboard')) {
    return (
      <DashboardLayout currentPath={path}>
        {path === '/dashboard' && <OverviewPage />}
        {path === '/dashboard/datasets' && <DatasetsPage />}
        {path === '/dashboard/pipelines' && <PipelineBuilderPage />}
        {path === '/dashboard/operations' && <OperationsPage />}
        {path === '/dashboard/jobs' && <JobsPage />}
        {path === '/dashboard/blocks' && <BlocksPage />}
        {path === '/dashboard/keys' && <ApiKeysPage />}
        {path === '/dashboard/webhooks' && <WebhooksPage />}
        {path === '/dashboard/credits' && <CreditsPage />}
      </DashboardLayout>
    )
  }
  
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
