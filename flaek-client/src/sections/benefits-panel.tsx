import { motion } from 'framer-motion'

const items = [
  {
    title: 'Verifiable execution',
    sub: 'Attested results',
    body: 'Every run includes an Arcium attestation (finalize_tx) so teams can independently prove the computation happened.'
  },
  {
    title: 'Private by default',
    sub: 'Encrypted inputs',
    body: 'Keep raw data private. Use retained batches for reproducibility or ephemeral ingest for run‑now without persistence.'
  },
  {
    title: 'Developer‑first',
    sub: 'Simple APIs',
    body: 'Clean REST, idempotency keys, and HMAC‑signed webhooks. Build visually or ship programmatically.'
  },
]

export default function BenefitsPanel() {
  return (
    <section className="section-bg">
      <div className="container-outer py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2, margin: '-10% 0px' }}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.55,
                    ease: [0.16, 1, 0.3, 1],
                    staggerChildren: 0.08,
                    delayChildren: 0.05,
                  },
                },
              }}
              transition={{ delay: i * 0.06 }}
            >
              <motion.h3
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }}
                className="text-2xl md:text-3xl font-semibold"
              >
                {it.title}
              </motion.h3>
              <motion.div
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }}
                className="mt-1 text-xl md:text-2xl text-white/70"
              >
                {it.sub}
              </motion.div>
              <motion.p
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }}
                className="mt-4 text-white/70 leading-relaxed"
              >
                {it.body}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
