import { motion } from 'framer-motion'
import Navbar from '@/sections/navbar'
import Footer from '@/sections/footer'
import { Clock } from 'lucide-react'

export default function Docs() {
  return (
    <div className="min-h-dvh text-text-primary bg-bg-base">
      <Navbar />
      <main className="container-outer py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-r from-brand-500/20 to-brand-600/20 backdrop-blur">
              <Clock size={28} className="text-brand-400" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">
            Documentation in progress
          </h1>
          
          <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Check back later... ETA: 7 days
          </p>
          
          <motion.a
            href="/"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-4 text-base font-medium text-white hover:brightness-110 transition-all"
          >
            Back to home
          </motion.a>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
