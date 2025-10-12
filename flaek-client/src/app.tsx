import { motion } from 'framer-motion'
import Navbar from './sections/navbar'
import Hero from './sections/hero'
import Footer from './sections/footer'
import HowItWorks from './sections/how-it-works'
import BenefitsPanel from './sections/benefits-panel'
import BlocksShowcase from './sections/blocks-showcase'
import LearnMore from './sections/learn-more'
import GlobalCompliance from './sections/global-compliance'
import ButtonLink from './components/button'
import SectionDivider from './components/section-divider'

export default function App() {
  return (
    <div className="min-h-dvh text-text-primary bg-bg-base">
      <Navbar />
      <main>
        <div id="nav-sentinel" className="h-1"></div>
        <Hero />
        <BenefitsPanel />
        <HowItWorks />
        <GlobalCompliance />
        <BlocksShowcase />
        <LearnMore />
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
              className="rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 p-10 md:p-14 text-center"
            >
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Ship compliant compute you can prove.</h3>
              <p className="mt-3 text-text-secondary max-w-2xl mx-auto">Keep raw data out of your app. Run on Arcium’s MXE and audit with on‑chain attestations.</p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <ButtonLink href="#get-started">Get API Key</ButtonLink>
                <ButtonLink href="#docs" variant="secondary">Read the Docs</ButtonLink>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
