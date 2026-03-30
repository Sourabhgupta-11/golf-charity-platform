'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { supabase } from '@/lib/supabase'
import type { Charity } from '@/types'
import { Heart, Search, ExternalLink } from 'lucide-react'

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [filtered, setFiltered] = useState<Charity[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('charities').select('*').eq('is_active', true).order('is_featured', { ascending: false })
      .then(({ data }) => {
        const list = (data as Charity[]) || []
        setCharities(list)
        setFiltered(list)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const q = query.toLowerCase()
    setFiltered(q ? charities.filter(c => c.name.toLowerCase().includes(q) || c.short_description?.toLowerCase().includes(q)) : charities)
  }, [query, charities])

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 px-4 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-coral text-xs uppercase tracking-widest mb-4 font-medium flex items-center gap-2 justify-center">
              <Heart size={12} />Your Impact
            </p>
            <h1 className="text-5xl sm:text-7xl font-black mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              Choose your<br /><span className="text-white/40">cause.</span>
            </h1>
            <p className="text-white/50 text-lg max-w-lg mx-auto">
              Every subscription funnels at least 10% to the charity you select. Discover who you could be supporting.
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto mb-12">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search charities..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input-dark w-full pl-10 pr-4 py-3 text-sm"
            />
          </div>

          {/* Charities grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="glass rounded-2xl h-64 shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map(charity => (
                <div key={charity.id} className="glass rounded-2xl overflow-hidden card-hover group">
                  {/* Image */}
                  <div className="relative h-52">
                    {charity.image_url ? (
                      <Image src={charity.image_url} alt={charity.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <Heart size={40} className="text-white/10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                    {charity.is_featured && (
                      <div className="absolute top-4 left-4 bg-coral text-white text-xs font-bold px-3 py-1 rounded-full">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                        {charity.name}
                      </h2>
                      {charity.website_url && (
                        <a href={charity.website_url} target="_blank" rel="noopener noreferrer"
                          className="text-white/30 hover:text-white transition-colors flex-shrink-0">
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed mb-4">{charity.description.slice(0, 160)}…</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-white/30">
                        <Heart size={12} className="text-coral" />
                        <span>£{charity.total_raised.toLocaleString()} raised</span>
                      </div>
                      <Link href={`/charities/${charity.slug}`}
                        className="text-sm text-lime hover:text-lime/80 font-medium transition-colors">
                        Learn more →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-20">
              <Heart size={40} className="text-white/10 mx-auto mb-4" />
              <p className="text-white/40">No charities found for &quot;{query}&quot;</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
