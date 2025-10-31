import { useEffect, useMemo, useRef, useState } from 'react'

type Pos = { x: number; y: number } | null

export default function BackgroundGrid({
  cell = 40,
  gap = 10,
  mouse,
  radiusX = 240,
  radiusY = 140,
}: {
  cell?: number
  gap?: number
  mouse: Pos
  radiusX?: number
  radiusY?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [{ cols, rows }, setGrid] = useState({ cols: 0, rows: 0, width: 0, height: 0 } as any)

  useEffect(() => {
    const compute = () => {
      const el = ref.current
      if (!el) return
      const w = el.offsetWidth
      const h = el.offsetHeight
      const c = Math.ceil(w / (cell + gap)) + 1
      const r = Math.ceil(h / (cell + gap)) + 1
      setGrid({ cols: c, rows: r, width: w, height: h })
    }
    compute()
    const ro = new ResizeObserver(compute)
    if (ref.current) ro.observe(ref.current)
    return () => ro.disconnect()
  }, [cell, gap])

  const cells = useMemo(() => Array.from({ length: cols * rows }), [cols, rows])

  const angle = (-12 * Math.PI) / 180 // tilt to suggest flow
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
          gridTemplateRows: `repeat(${rows}, ${cell}px)`,
          gap: `${gap}px`,
          justifyContent: 'center',
          alignContent: 'center',
        }}
      >
        {cells.map((_, i) => {
          const c = i % cols
          const r = Math.floor(i / cols)
          const cx = c * (cell + gap) + cell / 2
          const cy = r * (cell + gap) + cell / 2

          let intensity = 0
          if (mouse) {
            const dx = cx - mouse.x
            const dy = cy - mouse.y
            const rx = dx * cos - dy * sin
            const ry = dx * sin + dy * cos
            const d = Math.sqrt((rx / radiusX) ** 2 + (ry / radiusY) ** 2)
            intensity = Math.max(0, 1 - d)
            intensity = Math.pow(intensity, 1.4)
          }

          const fromA = 0.55 * intensity
          const toA = 0.35 * intensity
          const style: React.CSSProperties = intensity > 0.02
            ? {
                background: `linear-gradient(135deg, rgba(106,79,248,${fromA}) 0%, rgba(22,226,195,${toA}) 100%)`,
                opacity: Math.min(0.8, 0.08 + intensity * 0.9),
                transition: 'opacity 120ms linear',
              }
            : {
                opacity: undefined,
                animationDelay: `${(i % 7) * 0.4}s`,
              }

          return (
            <div key={i} className="relative pointer-events-none">
              <div className="absolute inset-0 rounded-md border border-[var(--color-border)]/60" />
              <div
                className={`absolute inset-0 rounded-md ${
                  intensity > 0.02
                    ? ''
                    : 'bg-gradient-to-br from-brand-500/0 to-accent-500/0 animate-[block-fade_6s_ease-in-out_infinite]'
                }`}
                style={style}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
