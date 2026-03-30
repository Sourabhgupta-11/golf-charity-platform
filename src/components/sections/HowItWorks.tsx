'use client'

import { useEffect, useRef } from 'react'
import { UserPlus, ClipboardList, Shuffle, Heart } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    number: '01',
    title: 'Subscribe',
    desc: 'Choose monthly or yearly. Your subscription funds the prize pool and a charity you care about.',
    accent: '#C8FF00',
  },
  {
    icon: ClipboardList,
    number: '02',
    title: 'Log Your Scores',
    desc: 'Enter your last 5 Stableford scores. Your most recent 5 are always active — new scores replace the oldest.',
    accent: '#C8FF00',
  },
  {
    icon: Shuffle,
    number: '03',
    title: 'Monthly Draw',
    desc: 'Each month, 5 winning numbers are drawn. Match 3, 4, or all 5 of your scores to win a share of the prize pool.',
    accent: '#FF5C3A',
  },
  {
    icon: Heart,
    number: '04',
    title: 'Charity Impact',
    desc: 'At least 10% of every subscription goes directly to your chosen charity — every month, automatically.',
    accent: '#FF5C3A',
  },
]

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.step-card').forEach((el, i) => {
              setTimeout(() => {
                (el as HTMLElement).style.opacity = '1'
                ;(el as HTMLElement).style.transform = 'translateY(0)'
              }, i * 120)
            })
          }
        })
      },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-32 px-4" id="how-it-works">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-lime text-xs uppercase tracking-widest mb-4 font-medium">The Loop</p>
          <h2 className="text-4xl sm:text-6xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
            Four steps.<br />
            <span className="text-white/40">Infinite impact.</span>
          </h2>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="step-card glass rounded-2xl p-6 relative overflow-hidden transition-all duration-300"
              style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}
            >
              {/* Background number */}
              <span
                className="absolute -right-2 -top-4 text-8xl font-black opacity-5 select-none"
                style={{ fontFamily: 'var(--font-display)', color: step.accent }}
              >
                {step.number}
              </span>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${step.accent}18`, border: `1px solid ${step.accent}30` }}
              >
                <step.icon size={20} style={{ color: step.accent }} />
              </div>

              {/* Label */}
              <p className="text-xs font-mono text-white/30 mb-2">{step.number}</p>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                {step.title}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${step.accent}40, transparent)` }}
              />
            </div>
          ))}
        </div>

        {/* Prize breakdown callout */}
        <div className="mt-16 glass rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-lime text-xs uppercase tracking-widest mb-3 font-medium">Prize Pool Split</p>
              <h3 className="text-3xl font-black mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Three tiers.<br />Real money.
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Your 5 most recent Stableford scores are your numbers in the draw. Match 3 or more to win — and if nobody hits the jackpot, it rolls over to next month.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { label: '5-Number Match', share: '40%', sub: 'Jackpot — rolls over if unclaimed', accent: '#C8FF00' },
                { label: '4-Number Match', share: '35%', sub: 'Split equally among all winners', accent: '#88AD00' },
                { label: '3-Number Match', share: '25%', sub: 'Split equally among all winners', accent: '#485B00' },
              ].map((tier) => (
                <div key={tier.label} className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: `${tier.accent}08`, border: `1px solid ${tier.accent}20` }}>
                  <div>
                    <p className="text-sm font-semibold text-white">{tier.label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{tier.sub}</p>
                  </div>
                  <span className="text-2xl font-black" style={{ fontFamily: 'var(--font-mono)', color: tier.accent }}>
                    {tier.share}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
