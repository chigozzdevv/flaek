import { motion } from 'framer-motion'
import SectionDivider from '../components/section-divider'
import { Database, Shield, FileCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: Database,
    title: 'Data residency & retention',
    description: 'Retained batches with TTL or ephemeral run-now.',
  },
  {
    icon: Shield,
    title: 'PII-safe pipelines',
    description: 'Run on encrypted inputs; keep raw data out of your app.',
  },
  {
    icon: FileCheck,
    title: 'Auditable attestations',
    description: 'Every job returns an Arcium finalize_tx for proof.',
  },
]

export default function GlobalCompliance() {
  return (
    <section className="section-demo relative overflow-hidden">
      <div className="container-outer pt-20 md:pt-32">
        <SectionDivider />
      </div>

      <div className="container-outer py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Map Visual */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1 flex items-center"
          >
            <div className="relative w-full rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl p-10 md:p-14 lg:p-16 overflow-hidden">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-purple-500/5" />

              {/* Map */}
              <div className="relative">
                <img
                  src="/world.svg"
                  alt="Global infrastructure map"
                  className="w-full h-auto opacity-60"
                />

                {/* Animated location dots */}
                <span className="absolute top-[28%] left-[18%] flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                </span>
                <span className="absolute top-[32%] right-[28%] flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" style={{ animationDelay: '0.7s' }}></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
                <span className="absolute bottom-[38%] left-[46%] flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" style={{ animationDelay: '1.4s' }}></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
                <span className="absolute bottom-[28%] right-[15%] flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" style={{ animationDelay: '2.1s' }}></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
              Globally data-compliant with private compute
            </h2>
            <p className="mt-6 text-base md:text-lg text-white/60 leading-relaxed">
              Handle sensitive data in private compute and stay regulatory compliant. Flaek's encrypted compute runs on Arcium's decentralized MXE network, ensuring compliance without compromising performance.
            </p>

            <div className="mt-10 space-y-6">
              {FEATURES.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-2.5">
                        <Icon size={20} className="text-white/80" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white/90">
                        {feature.title}
                      </h3>
                      <p className="mt-1.5 text-[15px] text-white/60 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
