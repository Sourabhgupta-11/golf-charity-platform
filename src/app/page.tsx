import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/sections/Hero'
import Marquee from '@/components/sections/Marquee'
import HowItWorks from '@/components/sections/HowItWorks'
import CharitiesPreview from '@/components/sections/CharitiesPreview'
import Pricing from '@/components/sections/Pricing'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <HowItWorks />
        <CharitiesPreview />
        <Pricing />
      </main>
      <Footer />
    </>
  )
}
