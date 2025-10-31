import { motion } from 'framer-motion'
import ButtonLink from '@/components/button'
import BackgroundGrid from '@/components/background-grid'
import { useState } from 'react'

export default function Hero() {
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)
  return (
    <section
      id="overview"
      className="relative hero-bg text-center overflow-hidden scroll-mt-24 md:scroll-mt-28"
      onMouseMove={(e) => {
        const t = e.currentTarget.getBoundingClientRect()
        setMouse({ x: e.clientX - t.left, y: e.clientY - t.top })
      }}
      onMouseLeave={() => setMouse(null)}
    >
      <BackgroundGrid mouse={mouse} />
      <div className="container-outer pt-28 pb-24 md:pt-36 md:pb-32 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl md:text-6xl font-semibold leading-tight tracking-tight text-balance max-w-4xl md:max-w-5xl mx-auto"
        >
          <span className="block">Execute private compute</span>
          <span className="block">on sensitive data</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="mt-6 md:mt-7 text-lg md:text-xl leading-7 md:leading-8 text-white/80 text-pretty max-w-2xl mx-auto"
        >
          Build dataset‑validated private compute pipelines with a visual builder or API, and integrate via HMAC‑signed webhooks — powered by Arcium.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="mt-10 flex flex-col md:flex-row items-center justify-center gap-3"
        >
          <ButtonLink href="/get-started" className="md:w-auto">Get started</ButtonLink>
          <ButtonLink href="/docs" variant="secondary" className="md:w-auto">Read the Docs</ButtonLink>
        </motion.div>

      </div>
    </section>
  )
}
