import { motion } from 'framer-motion'
import Navbar from './sections/navbar'
import Hero from './sections/hero'
import ValueProps from './sections/value-props'
import ProductCards from './sections/product-cards'
import Stats from './sections/stats'
import Footer from './sections/footer'

export default function App() {
  return (
    <div className="min-h-dvh text-text-primary bg-bg-base">
      <Navbar />
      <main>
        <div id="nav-sentinel" className="h-1"></div>
        <Hero />
        <section className="container-outer py-20 md:py-28">
          <ValueProps />
        </section>
        <section className="container-outer py-16 md:py-24">
          <ProductCards />
        </section>
        <section className="container-outer py-16 md:py-24">
          <Stats />
        </section>
        <section className="container-outer py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl bg-bg-elev/60 backdrop-blur border border-[var(--color-border)] p-10 md:p-14 text-center"
          >
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Start building with verifiable privacy</h3>
            <p className="mt-3 text-text-secondary max-w-2xl mx-auto">Get an API key and ship a pipeline in minutes. Results include signed webhooks and on-chain attestations.</p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <a href="#" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm md:text-base font-medium">Get API Key</a>
              <a href="#docs" className="inline-flex items-center justify-center rounded-full border border-white/10 hover:border-white/20 px-6 py-3 text-sm md:text-base">Read the Docs</a>
            </div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
