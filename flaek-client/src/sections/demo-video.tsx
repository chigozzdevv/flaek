import { useState } from 'react'
import { motion } from 'framer-motion'

export default function DemoVideo({
  title = 'Watch the 60‑second demo',
  mp4 = '/demo.mp4',
  poster = '/demo-poster.jpg',
  fallbackEmbed = 'https://www.youtube.com/embed/VIDEO_ID?rel=0&modestbranding=1&autoplay=1',
}: {
  title?: string
  mp4?: string
  poster?: string
  fallbackEmbed?: string
}) {
  const [playing, setPlaying] = useState(false)
  const [useEmbed, setUseEmbed] = useState(false)

  const start = () => {
    // Try native video first; if it fails to mount, fall back to embed
    setPlaying(true)
  }

  return (
    <section className="relative section-demo text-center overflow-hidden">
      <div className="container-outer py-16 md:py-24 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-semibold tracking-tight"
        >
          {title}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-6 md:mt-8 max-w-6xl mx-auto"
        >
          <div className="relative rounded-[24px] border border-[var(--color-border)] bg-white/5 backdrop-blur overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.45)]">
            <ChromeBar />
            <div className="relative">
              {!playing ? (
                <button
                  onClick={start}
                  aria-label="Play demo"
                  className="group relative block w-full"
                >
                  <img src={poster} alt="Demo preview" className="w-full block select-none" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="h-16 w-16 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm grid place-items-center group-hover:bg-white/15 transition">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M8 5v14l11-7-11-7z" fill="white"/>
                      </svg>
                    </div>
                  </div>
                  <div className="absolute -inset-8 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/20 to-accent-500/20 blur-3xl" />
                  </div>
                </button>
              ) : useEmbed ? (
                <iframe
                  className="w-full aspect-video"
                  src={fallbackEmbed}
                  title="Flaek demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  className="w-full"
                  poster={poster}
                  autoPlay
                  playsInline
                  controls
                  onError={() => setUseEmbed(true)}
                >
                  <source src={mp4} type="video/mp4" />
                </video>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      <div className="section-demo-over"></div>
    </section>
  )
}

function ChromeBar() {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]/70">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-300/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
      </div>
      <div className="text-xs text-white/60">demo.flaek.app</div>
      <div className="text-xs text-white/30">⌘K</div>
    </div>
  )
}

