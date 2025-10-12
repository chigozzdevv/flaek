import { useState } from 'react'

export default function BrandLogo({ className = '' }: { className?: string }) {
  const sources = ['/flaek-logo.png', '/logo.svg', '/favicon.svg']
  const [idx, setIdx] = useState(0)
  const src = sources[Math.min(idx, sources.length - 1)]
  return (
    <a href="/" aria-label="Flaek" className={`inline-flex items-center overflow-visible ${className}`}>
      <img
        src={src}
        alt=""
        className="block h-16 w-auto select-none object-contain transform-gpu origin-left scale-110 md:scale-125"
        onError={() => setIdx((i) => Math.min(i + 1, sources.length - 1))}
        loading="eager"
        decoding="sync"
        draggable={false}
      />
      <span className="sr-only">Flaek</span>
    </a>
  )
}
