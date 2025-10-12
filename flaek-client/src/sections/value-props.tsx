import { motion } from 'framer-motion'

const items = [
  {
    title: 'Verifiable execution',
    subtitle: 'Attested results',
    body: 'Every job includes an attestation anchored to Solana for proof of processing.',
  },
  {
    title: 'Private by default',
    subtitle: 'Encrypted inputs',
    body: 'Run pipelines without exposing raw data. Ephemeral or retained ingest options.',
  },
  {
    title: 'Developer‑first',
    subtitle: 'Simple APIs',
    body: 'Clean REST, idempotency keys, and signed webhooks. Visual pipeline builder or code.',
  },
]

export default function ValueProps() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {items.map((it, i) => (
        <motion.div
          key={it.title}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          className="text-left"
        >
          <h3 className="text-2xl font-semibold tracking-tight">{it.title}</h3>
          <div className="mt-1 text-brand-500 font-medium">{it.subtitle}</div>
          <p className="mt-3 text-text-secondary">{it.body}</p>
        </motion.div>
      ))}
    </div>
  )
}

