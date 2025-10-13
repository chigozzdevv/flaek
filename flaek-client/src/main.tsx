import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app.tsx'
import GetStartedPage from './pages/get-started'
import SigninPage from './pages/signin'

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
  if (path === '/docs') return <App />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
