import { motion } from 'framer-motion'
import ButtonLink from '../components/button'
import BackgroundGrid from '../components/background-grid'
import { useState } from 'react'

export default function Hero() {
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)
  return (
    <section
      className="relative hero-bg text-center overflow-hidden"
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
          className="text-4xl md:text-6xl font-semibold tracking-tight max-w-5xl mx-auto"
        >
          Execute private compute on sensitive data
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="mt-5 md:mt-6 text-lg md:text-xl text-text-secondary max-w-3xl mx-auto"
        >
          Design pipelines with a visual builder or use the API. Flaek orchestrates privacy‑preserving computation on Arcium and delivers signed results with on‑chain attestations.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="mt-10 flex items-center justify-center gap-3"
        >
          <ButtonLink href="#get-started">Get started</ButtonLink>
          <ButtonLink href="#docs" variant="secondary">Read the Docs</ButtonLink>
        </motion.div>

      </div>
    </section>
  )
}
