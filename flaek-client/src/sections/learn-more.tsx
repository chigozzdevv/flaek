import { motion } from 'framer-motion'
import SectionDivider from '@/components/section-divider'
import {BookOpen, Newspaper } from 'lucide-react'

const BLOGS = [
  {
    title: 'Intro to verifiable compute',
    source: 'Flaek Team · 4 minute read',
  },
  {
    title: 'Privacy-first data workflows',
    source: 'Flaek Team · 7 minute read',
  },
  {
    title: 'Attestations in practice',
    source: 'Flaek R&D · 10 minute read',
  },
]

const DOCS = [
  { title: 'Create a dataset', meta: '3 minute read' },
  { title: 'Compose a pipeline', meta: '4 minute read' },
  { title: 'Integrate & execute a job', meta: '6 minute read' },
]

export default function LearnMore() {
  return (
    <section id="learn-more" className="section-demo relative overflow-hidden">
      <div className="container-outer pt-20 md:pt-32">
        <SectionDivider />
      </div>

      <div className="container-outer py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-left mb-8 md:mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">Learn more</h2>
          <p className="mt-3 md:mt-4 text-base md:text-lg text-white/70 max-w-3xl md:max-w-2xl mx-0">
            Deepen your understanding of private compute with short guides and posts.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2, margin: '-10% 0px' }}
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.08, delayChildren: 0.05 } },
            }}
          >
            <div className="text-xs tracking-widest text-white/50 mb-3">BLOG</div>
            <div className="space-y-3">
              {BLOGS.map((b) => (
                <motion.a
                  key={b.title}
                  href="/docs"
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }}
                  className="group relative block rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-4 md:p-5 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      <Newspaper size={16} className="text-white/80" />
                    </div>
                    <div>
                      <div className="text-base md:text-lg font-medium">{b.title}</div>
                      <div className="mt-1 text-xs text-white/50">{b.source}</div>
                    </div>
                  </div>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40 group-hover:text-white/70 transition-colors">
                    <span className="inline-block transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5 group-hover:-rotate-45">→</span>
                  </span>
                </motion.a>
              ))}
            </div>
            <a href="#" className="group mt-3 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors">
              View all posts
              <span className="inline-block transition-transform translate-x-0 group-hover:translate-x-1 group-hover:-translate-y-0.5 group-hover:-rotate-45">→</span>
            </a>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2, margin: '-10% 0px' }}
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.08, delayChildren: 0.05 } },
            }}
          >
            <div className="text-xs tracking-widest text-white/50 mb-3">DOCS</div>
            <div className="space-y-3">
              {DOCS.map((d) => (
                <motion.a
                  key={d.title}
                  href="/docs"
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }}
                  className="group relative block rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-4 md:p-5 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      <BookOpen size={16} className="text-white/80" />
                    </div>
                    <div>
                      <div className="text-base md:text-lg font-medium">{d.title}</div>
                      <div className="mt-1 text-xs text-white/50">{d.meta}</div>
                    </div>
                  </div>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40 group-hover:text-white/70 transition-colors">
                    <span className="inline-block transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5 group-hover:-rotate-45">→</span>
                  </span>
                </motion.a>
              ))}
            </div>
            <a href="/docs" className="group mt-3 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors">
              Go to docs
              <span className="inline-block transition-transform translate-x-0 group-hover:translate-x-1 group-hover:-translate-y-0.5 group-hover:-rotate-45">→</span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
