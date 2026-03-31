'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import { Users, Trophy, Heart, TrendingUp, DollarSign, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Stats {
  totalUsers: number
  activeSubscribers: number
  totalPrizePool: number
  totalCharityRaised: number
  totalDraws: number
  pendingWinners: number
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, activeSubscribers: 0, totalPrizePool: 0,
    totalCharityRaised: 0, totalDraws: 0, pendingWinners: 0
  })
  const [drawStats, setDrawStats] = useState<{ month: string; pool: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: totalUsers },
        { count: activeSubscribers },
        { data: draws },
        { data: contributions },
        { count: totalDraws },
        { count: pendingWinners },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
        supabase.from('draws').select('draw_month, prize_pool_total').eq('status', 'published').order('draw_month', { ascending: true }).limit(6),
        supabase.from('charity_contributions').select('amount'),
        supabase.from('draws').select('*', { count: 'exact', head: true }),
        supabase.from('winners').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      ])

      const totalCharityRaised = (contributions || []).reduce((s, c) => s + Number(c.amount), 0)
      const totalPrizePool = (draws || []).reduce((s, d) => s + Number(d.prize_pool_total), 0)

      setStats({
        totalUsers: totalUsers || 0,
        activeSubscribers: activeSubscribers || 0,
        totalPrizePool,
        totalCharityRaised,
        totalDraws: totalDraws || 0,
        pendingWinners: pendingWinners || 0,
      })

      if (draws) {
        setDrawStats(draws.map(d => ({
          month: new Date(d.draw_month).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
          pool: Number(d.prize_pool_total),
        })))
      }

      setLoading(false)
    }
    fetchStats()
  }, [])

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-lime', bg: 'bg-lime/10' },
    { label: 'Active Subscribers', value: stats.activeSubscribers, icon: Activity, color: 'text-lime', bg: 'bg-lime/10' },
    { label: 'Total Prize Pool (All Time)', value: `£${stats.totalPrizePool.toFixed(2)}`, icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Charity Raised (All Time)', value: `£${stats.totalCharityRaised.toFixed(2)}`, icon: Heart, color: 'text-coral', bg: 'bg-coral/10' },
    { label: 'Draws Published', value: stats.totalDraws, icon: TrendingUp, color: 'text-white/70', bg: 'bg-white/5' },
    { label: 'Pending Verifications', value: stats.pendingWinners, icon: DollarSign, color: stats.pendingWinners > 0 ? 'text-yellow-400' : 'text-white/40', bg: 'bg-yellow-400/10' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>Admin Overview</h1>
        <p className="text-white/40 text-sm mt-1">Platform analytics and quick stats</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className={`text-2xl font-black ${color}`} style={{ fontFamily: 'var(--font-mono)' }}>
              {loading ? '…' : value}
            </p>
            <p className="text-white/40 text-xs mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {/* Prize pool chart */}
      {drawStats.length > 0 && (
        <Card>
          <h2 className="text-lg font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Prize Pool by Draw (Last 6 Months)
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={drawStats} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `£${v}`} />
              <Tooltip
                contentStyle={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(v: number) => [`£${v.toFixed(2)}`, 'Prize Pool']}
              />
              <Bar dataKey="pool" fill="#C8FF00" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
