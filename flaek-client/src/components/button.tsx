import type { PropsWithChildren } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

type ButtonLinkProps = PropsWithChildren<{
  href: string
  variant?: Variant
  className?: string
}>

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:brightness-110',
  secondary: 'border border-white/10 hover:border-white/20',
  ghost: 'hover:bg-white/5',
}

export default function ButtonLink({ href, children, variant = 'primary', className = '' }: ButtonLinkProps) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm md:text-base font-medium transition ${variants[variant]} ${className}`}
    >
      {children}
    </a>
  )
}
