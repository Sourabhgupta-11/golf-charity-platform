import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HowItWorks from '@/components/sections/HowItWorks'
import Pricing from '@/components/sections/Pricing'

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24">
        <div className="text-center py-20 px-4">
          <h1 className="text-5xl sm:text-7xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
            How Greenloop<br /><span className="text-white/30">works.</span>
          </h1>
        </div>
        <HowItWorks />
        <Pricing />
      </main>
      <Footer />
    </>
  )
}
