'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import { User, CreditCard, AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth()
  const [name, setName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel? You\'ll retain access until the end of your billing period.')) return
    setCancelLoading(true)
    try {
      const res = await fetch('/api/razorpay/cancel', { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Subscription cancelled. Access retained until period ends.')
      await refreshProfile()
    } catch {
      toast.error('Failed to cancel. Please contact support.')
    } finally {
      setCancelLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>Settings</h1>
        <p className="text-white/40 text-sm mt-1">Manage your account and subscription</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-lime/15 flex items-center justify-center">
              <User size={18} className="text-lime" />
            </div>
            <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>Profile</h2>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <Input label="Email" value={profile?.email || ''} disabled hint="Email cannot be changed here" />
            <Button type="submit" loading={saving}>Save Changes</Button>
          </form>
        </Card>

        {/* Subscription */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-lime/15 flex items-center justify-center">
              <CreditCard size={18} className="text-lime" />
            </div>
            <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>Subscription</h2>
          </div>

          <div className="glass rounded-xl p-4 mb-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/50">Plan</span>
              <span className="text-white capitalize font-medium">{profile?.subscription_plan || 'None'}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/50">Status</span>
              <span className={`capitalize font-medium ${profile?.subscription_status === 'active' ? 'text-lime' : 'text-coral'}`}>
                {profile?.subscription_status || 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/50">Payment method</span>
              <span className="text-white/60">Razorpay (UPI / Card / Netbanking)</span>
            </div>
            {profile?.subscription_ends_at && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Access until</span>
                <span className="text-white">{new Date(profile.subscription_ends_at).toLocaleDateString('en-IN')}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            {profile?.subscription_status !== 'active' && (
              <Button variant="primary" size="sm" onClick={() => window.location.href = '/subscribe'}>
                Renew Subscription
              </Button>
            )}
            {profile?.subscription_status === 'active' && (
              <Button variant="ghost" onClick={handleCancel} loading={cancelLoading} size="sm"
                className="text-coral hover:text-coral hover:bg-coral/10">
                Cancel Subscription
              </Button>
            )}
          </div>
          <p className="text-white/20 text-xs mt-4">
            For payment disputes or refunds, contact support at support@greenloop.in
          </p>
        </Card>

        {/* Danger zone */}
        <Card className="border border-coral/20">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-coral/15 flex items-center justify-center">
              <AlertTriangle size={18} className="text-coral" />
            </div>
            <h2 className="font-bold text-coral" style={{ fontFamily: 'var(--font-display)' }}>Danger Zone</h2>
          </div>
          <p className="text-white/40 text-sm mb-4">
            Permanently delete your account and all data. This cannot be undone.
          </p>
          <Button variant="danger" size="sm"
            onClick={() => toast.error('Contact support@greenloop.in to delete your account.')}>
            Delete Account
          </Button>
        </Card>
      </div>
    </div>
  )
}
