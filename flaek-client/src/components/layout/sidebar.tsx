import { LayoutDashboard, Database, Workflow, Package, Briefcase, Blocks, Key, Webhook, CreditCard, LogOut, Play, Settings as SettingsIcon } from 'lucide-react'
import BrandLogo from '@/components/brand-logo'
import { navigate } from '@/lib/router'
import { clearToken } from '@/lib/auth'

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
  { icon: Database, label: 'Datasets', path: '/dashboard/datasets' },
  { icon: Workflow, label: 'Pipeline Builder', path: '/dashboard/pipelines' },
  { icon: Package, label: 'Operations', path: '/dashboard/operations' },
  { icon: Play, label: 'Playground', path: '/dashboard/playground' },
  { icon: Briefcase, label: 'Jobs', path: '/dashboard/jobs' },
  { icon: Blocks, label: 'Blocks Library', path: '/dashboard/blocks' },
  { icon: Key, label: 'API Keys', path: '/dashboard/keys' },
  { icon: Webhook, label: 'Webhooks', path: '/dashboard/webhooks' },
  { icon: CreditCard, label: 'Credits', path: '/dashboard/credits' },
  { icon: SettingsIcon, label: 'Settings', path: '/dashboard/settings' },
]

type SidebarProps = {
  currentPath: string
}

export function Sidebar({ currentPath }: SidebarProps) {
  const handleLogout = () => {
    clearToken()
    navigate('/')
  }

  return (
    <div className="fixed top-0 left-0 h-screen w-64 border-r border-white/10 bg-bg-elev flex flex-col z-40">
      <div className="h-16 px-6 border-b border-white/10 flex items-center">
        <BrandLogo className="h-7" />
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPath === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-500/10 text-brand-500'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
