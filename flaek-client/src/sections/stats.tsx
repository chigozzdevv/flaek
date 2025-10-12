import { motion } from 'framer-motion'

const stats = [
  { label: 'Jobs processed', value: '10K+' },
  { label: 'Finalization txs', value: '50K+' },
  { label: 'Uptime', value: '99.99%+' },
]

export default function Stats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          className="rounded-3xl bg-bg-elev/50 border border-[var(--color-border)] p-6 text-center"
        >
          <div className="text-3xl font-semibold">{s.value}</div>
          <div className="mt-1 text-text-secondary">{s.label}</div>
        </motion.div>
      ))}
    </div>
  )
}
