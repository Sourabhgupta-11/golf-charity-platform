'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import { Heart, Check } from 'lucide-react'
import Image from 'next/image'
import type { Charity } from '@/types'

export default function CharityDashboardPage() {
  const { profile, refreshProfile } = useAuth()
  const [charities, setCharities] = useState<Charity[]>([])
  const [selected, setSelected] = useState<string | undefined>()
  const [percentage, setPercentage] = useState(10)
  const [saving, setSaving] = useState(false)

  // Sync from profile when it loads
  useEffect(() => {
    if (profile) {
      setSelected(profile.charity_id)
      setPercentage(profile.charity_percentage || 10)
    }
  }, [profile?.id])

  useEffect(() => {
    supabase
      .from('charities')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .then(({ data }) => setCharities((data as Charity[]) || []))
  }, [])

  const handleSave = async () => {
    if (!profile) return
    if (!selected) { toast.error('Please select a charity first'); return }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          charity_id: selected,
          charity_percentage: percentage,
        })
        .eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Charity preference saved!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save preference')
    } finally {
      setSaving(false)
    }
  }

  // INR amounts
  const monthlyFee = profile?.subscription_plan === 'yearly' ? 7499 / 12 : 829
  const charityAmount = ((percentage / 100) * monthlyFee).toFixed(2)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
          My Charity
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Choose the cause you want to support with your subscription
        </p>
      </div>

      {/* Contribution calculator */}
      <Card className="mb-8 border border-coral/20">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-coral/15 flex items-center justify-center">
            <Heart size={18} className="text-coral" />
          </div>
          <div>
            <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Your Contribution
            </h2>
            <p className="text-white/40 text-xs">Calculated from your active subscription</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <label className="text-sm text-white/70">Charity percentage</label>
            <span className="text-lime font-mono font-bold">{percentage}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={percentage}
            onChange={e => setPercentage(Number(e.target.value))}
            className="w-full accent-lime"
          />
          <div className="flex justify-between text-xs text-white/30 mt-1">
            <span>10% (minimum)</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex items-center justify-between glass rounded-xl p-4">
          <div>
            <p className="text-white/50 text-sm">Monthly charity contribution</p>
            <p className="text-white/30 text-xs">
              Based on your {profile?.subscription_plan || 'monthly'} plan
            </p>
          </div>
          <p className="text-3xl font-black text-coral" style={{ fontFamily: 'var(--font-mono)' }}>
            ₹{charityAmount}
          </p>
        </div>
      </Card>

      {/* Charity selection */}
      <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
        Select a Charity
      </h2>
      {charities.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <Heart size={28} className="text-white/10 mx-auto mb-2" />
          <p className="text-white/30 text-sm">No charities available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {charities.map(charity => {
            const isSelected = selected === charity.id
            return (
              <button
                key={charity.id}
                onClick={() => setSelected(charity.id)}
                className={`rounded-2xl overflow-hidden text-left transition-all card-hover ${
                  isSelected
                    ? 'ring-2 ring-lime ring-offset-2 ring-offset-ink'
                    : 'glass'
                }`}
              >
                <div className="relative h-32">
                  {charity.image_url ? (
                    <Image
                      src={charity.image_url}
                      alt={charity.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <Heart size={24} className="text-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-lime flex items-center justify-center">
                      <Check size={14} className="text-ink" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-white font-semibold text-sm">{charity.name}</p>
                  <p className="text-white/40 text-xs mt-1">{charity.short_description}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Button onClick={handleSave} loading={saving} size="lg" disabled={!selected}>
        <Heart size={16} />Save Charity Preference
      </Button>
    </div>
  )
}
