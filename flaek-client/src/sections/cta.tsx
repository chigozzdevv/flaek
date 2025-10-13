import { motion } from 'framer-motion'
import SectionDivider from '../components/section-divider'
import ButtonLink from '../components/button'

export default function CTA() {
  return (
    <section id="get-started" className="section-demo relative overflow-hidden">
      <div className="container-outer pt-20 md:pt-32">
        <SectionDivider />
      </div>
      <div className="container-outer py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2, margin: '-10% 0px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="section-surface p-8 md:p-14 text-center"
        >
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Ship compliant compute you can prove.</h3>
          <p className="mt-3 text-text-secondary max-w-2xl mx-auto">Keep raw data out of your app. Run on Arcium’s MXE and audit with on‑chain attestations.</p>
          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-3">
            <ButtonLink href="/get-started" className="md:w-auto">Get API Key</ButtonLink>
            <ButtonLink href="/docs" variant="secondary" className="md:w-auto">Read the Docs</ButtonLink>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
