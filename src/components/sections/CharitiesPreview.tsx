'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Charity } from '@/types'

export default function CharitiesPreview() {
  const [charities, setCharities] = useState<Charity[]>([])

  useEffect(() => {
    supabase
      .from('charities')
      .select('*')
      .eq('is_active', true)
      .limit(3)
      .then(({ data }: { data: unknown }) => { if (data) setCharities(data as Charity[]) })
  }, [])

  const placeholders = [
    { name: 'Greenside Foundation', short_description: 'Mental health support for young athletes across the UK.' },
    { name: 'Fairway for All', short_description: 'Making golf accessible to underprivileged communities.' },
    { name: 'The Par Project', short_description: 'Environmental conservation through golf course partnerships.' },
  ]

  const display = charities.length > 0 ? charities : placeholders

  return (
    <section className="py-32 px-4 relative">
      {/* Background decoration */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-coral/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <p className="text-coral text-xs uppercase tracking-widest mb-4 font-medium flex items-center gap-2">
              <Heart size={12} /> Your Impact
            </p>
            <h2 className="text-4xl sm:text-6xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
              Choose the cause<br />
              <span className="text-white/40">you champion.</span>
            </h2>
          </div>
          <Link
            href="/charities"   //call src/app/charities/page.tsx
            className="flex items-center gap-2 text-white/60 hover:text-lime transition-colors text-sm group"
          >
            View all charities
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {display.map((charity, i) => (
            <Link
              key={(charity as Charity).id || i}
              href={`/charities/${(charity as Charity).slug || i}`}
              className="group glass rounded-2xl overflow-hidden card-hover block"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-white/5">
                {(charity as Charity).image_url ? (
                  <Image
                    src={(charity as Charity).image_url!}
                    alt={charity.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart size={32} className="text-white/10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  {charity.name}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed mb-4">
                  {charity.short_description}
                </p>
                <div className="flex items-center gap-1.5 text-coral text-xs font-medium">
                  <Heart size={12} />
                  <span>Support this charity</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center glass rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-coral/10 via-transparent to-lime/10 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-white/50 text-sm mb-2">Minimum 10% of every subscription goes to your chosen charity</p>
            <h3 className="text-3xl font-black mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              You can give more, if you want.
            </h3>
            <p className="text-white/40 text-sm max-w-md mx-auto mb-8">
              Increase your charity percentage anytime from your dashboard. Some of our subscribers give up to 50%.
            </p>
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-2 bg-lime text-ink font-bold px-8 py-4 rounded-full hover:bg-lime/90 transition-all hover:shadow-lg hover:shadow-lime/20"
            >
              Join & Make an Impact <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
