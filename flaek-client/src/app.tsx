import Navbar from '@/sections/navbar'
import Hero from '@/sections/hero'
import Footer from '@/sections/footer'
import HowItWorks from '@/sections/how-it-works'
import BenefitsPanel from '@/sections/benefits-panel'
import BlocksShowcase from '@/sections/blocks-showcase'
import LearnMore from '@/sections/learn-more'
import GlobalCompliance from '@/sections/global-compliance'
import CTA from '@/sections/cta'

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
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
