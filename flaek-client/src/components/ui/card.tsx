import type { PropsWithChildren } from 'react'

type CardProps = PropsWithChildren<{
  className?: string
}>

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-6 ${className}`}>
      {children}
    </div>
  )
}
