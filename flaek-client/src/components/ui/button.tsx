import type { PropsWithChildren } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonProps = PropsWithChildren<{
  variant?: ButtonVariant
  loading?: boolean
  className?: string
}> & React.ButtonHTMLAttributes<HTMLButtonElement>

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:brightness-110 shadow-lg shadow-brand-500/20',
  secondary: 'border border-white/10 hover:border-white/20 hover:bg-white/5',
  ghost: 'hover:bg-white/5',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
}

export function Button({ variant = 'primary', loading, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}
