/*
Slug folder:
It’s a dynamic route
Means:
  URL changes based on data
  What it does
  Shows details of ONE charity
*/

import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ExternalLink, Calendar, ArrowLeft } from 'lucide-react'
import type { Charity } from '@/types'
import { notFound } from 'next/navigation'

export default async function CharityDetailPage({ params }: { params: { slug: string } }) {
  const { data } = await supabase.from('charities').select('*').eq('slug', params.slug).single()
  if (!data) notFound()
  const charity = data as Charity

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Link href="/charities" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-8">
            <ArrowLeft size={14} />Back to Charities
          </Link>

          {/* Hero image */}
          {charity.image_url && (
            <div className="relative h-72 rounded-3xl overflow-hidden mb-10">
              <Image src={charity.image_url} alt={charity.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Main */}
            <div className="md:col-span-2">
              <h1 className="text-4xl sm:text-5xl font-black mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {charity.name}
              </h1>
              <p className="text-white/60 leading-relaxed text-base mb-8">{charity.description}</p>

              {charity.upcoming_events?.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <Calendar size={18} className="text-lime" />Upcoming Events
                  </h2>
                  <div className="space-y-3">
                    {charity.upcoming_events.map((ev, i) => (
                      <div key={i} className="glass rounded-2xl p-5">
                        <p className="text-white font-semibold">{ev.title}</p>
                        <p className="text-white/40 text-sm mt-1">{ev.date} · {ev.location}</p>
                        {ev.description && <p className="text-white/50 text-sm mt-2">{ev.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="glass rounded-2xl p-6">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Total Raised</p>
                <p className="text-4xl font-black text-lime mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
                  £{charity.total_raised.toLocaleString()}
                </p>
                <p className="text-white/30 text-xs">Through Greenloop subscriptions</p>
              </div>

              {charity.website_url && (
                <a href={charity.website_url} target="_blank" rel="noopener noreferrer"
                  className="glass rounded-2xl p-4 flex items-center gap-3 hover:border-white/20 transition-all group block">
                  <ExternalLink size={16} className="text-white/40 group-hover:text-lime transition-colors" />
                  <span className="text-white/60 text-sm group-hover:text-white transition-colors">Visit website</span>
                </a>
              )}

              <Link href="/subscribe"
                className="block bg-coral text-white font-bold text-center py-4 px-6 rounded-2xl hover:bg-coral/90 transition-all">
                <Heart size={16} className="inline mr-2" />
                Support this charity
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
