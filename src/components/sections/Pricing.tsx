'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Zap } from 'lucide-react'

const features = [
  'Automated monthly prize draw entry',
  'Enter up to 5 Stableford scores',
  'Charity contribution (min. 10%)',
  'Real-time draw results',
  'Winner verification system',
  'Full participation history',
  'Mobile-optimised dashboard',
]

export default function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <section className="py-32 px-4" id="pricing">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-lime text-xs uppercase tracking-widest mb-4 font-medium">Subscription</p>
        <h2 className="text-4xl sm:text-6xl font-black mb-6" style={{ fontFamily: 'var(--font-display)' }}>
          One simple plan.
        </h2>
        <p className="text-white/50 text-lg mb-12 max-w-lg mx-auto">
          No tiers, no hidden fees. Choose your billing cycle and you&apos;re in.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex glass border border-white/10 rounded-full p-1 mb-12">
          {(['monthly', 'yearly'] as const).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBilling(cycle)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                billing === cycle ? 'bg-lime text-ink shadow-lg' : 'text-white/60 hover:text-white'
              }`}
            >
              {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
              {cycle === 'yearly' && billing !== 'yearly' && (
                <span className="ml-2 text-xs text-lime">Save 25%</span>
              )}
            </button>
          ))}
        </div>

        {/* Price card */}
        <div className="glass rounded-3xl p-10 md:p-14 relative overflow-hidden glow-lime-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-lime/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-lime/40 to-transparent" />

          <div className="relative z-10">
            <div className="flex items-end justify-center gap-2 mb-2">
              <span className="text-7xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
                £{billing === 'monthly' ? '9.99' : '89.99'}
              </span>
              <span className="text-white/40 text-lg mb-3">/{billing === 'monthly' ? 'mo' : 'yr'}</span>
            </div>

            {billing === 'yearly' && (
              <p className="text-lime text-sm mb-8">
                <Zap size={12} className="inline mr-1" />
                Equivalent to £7.50/mo — save £29.89 a year
              </p>
            )}

            {billing === 'monthly' && <p className="text-white/40 text-sm mb-8">Billed monthly · Cancel anytime</p>}

            {/* Features */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 text-left">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="w-5 h-5 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-lime" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={`/subscribe?plan=${billing}`}
              className="inline-flex items-center gap-2 bg-lime text-ink font-bold text-lg px-12 py-4 rounded-full hover:bg-lime/90 transition-all hover:shadow-2xl hover:shadow-lime/30"
            >
              Get Started — £{billing === 'monthly' ? '9.99' : '89.99'}
            </Link>

            <p className="text-white/30 text-xs mt-6">
              Secure payment via Razorpay · 10% minimum goes to your chosen charity
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
