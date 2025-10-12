import { motion } from 'framer-motion'

const cards = [
  {
    title: 'Pipelines',
    body: 'Design visual pipelines or define operations by API, with branching and parameters.',
    cta: 'Explore Pipelines',
    href: '#pipelines',
  },
  {
    title: 'Attestations',
    body: 'Get verifiable proofs of execution including finalize transactions and status.',
    cta: 'View Attestations',
    href: '#attestations',
  },
  {
    title: 'Webhooks',
    body: 'Receive signed events for job completion or failure with retries and backoff.',
    cta: 'Webhook Guide',
    href: '#docs-webhooks',
  },
]

export default function ProductCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((c, i) => (
        <motion.a
          key={c.title}
          href={c.href}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.06 }}
          className="group rounded-3xl bg-bg-elev/60 border border-[var(--color-border)] p-6 md:p-8 hover:border-brand-500/50 transition"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 opacity-90" />
          <h4 className="mt-5 text-xl font-semibold">{c.title}</h4>
          <p className="mt-2 text-text-secondary">{c.body}</p>
          <div className="mt-6 text-sm font-medium text-brand-500">{c.cta} →</div>
        </motion.a>
      ))}
    </div>
  )
}
