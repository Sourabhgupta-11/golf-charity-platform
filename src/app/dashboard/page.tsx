'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import { Trophy, Heart, ClipboardList, ArrowRight, TrendingUp, Calendar } from 'lucide-react'
import type { GolfScore, Winner, Draw } from '@/types'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { profile } = useAuth()
  const [scores, setScores] = useState<GolfScore[]>([])
  const [wins, setWins] = useState<Winner[]>([])
  const [latestDraw, setLatestDraw] = useState<Draw | null>(null)

  useEffect(() => {
    if (!profile) return

    // Fetch scores
    supabase.from('golf_scores').select('*').eq('user_id', profile.id)
      .order('played_at', { ascending: false }).limit(5)
      .then(({ data }) => setScores((data as GolfScore[]) || []))

    // Fetch wins
    supabase.from('winners').select('*, draw:draws(*)').eq('user_id', profile.id)
      .then(({ data }) => setWins((data as Winner[]) || []))

    // Latest published draw
    supabase.from('draws').select('*').eq('status', 'published')
      .order('draw_month', { ascending: false }).limit(1)
      .then(({ data }) => { if (data?.[0]) setLatestDraw(data[0] as Draw) })
  }, [profile?.id])

  const totalWon = wins.reduce((sum, w) => sum + Number(w.prize_amount), 0)
  const avgScore = scores.length ? Math.round(scores.reduce((s, sc) => s + sc.score, 0) / scores.length) : 0

  return (
    <div className="max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Hey, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-white/40 mt-1 text-sm">Here&apos;s your Greenloop overview</p>
      </div>

      {/* Status bar */}
      <div className={`rounded-2xl p-4 mb-8 flex items-center justify-between flex-wrap gap-4 ${
        profile?.subscription_status === 'active' ? 'bg-lime/10 border border-lime/20' : 'bg-coral/10 border border-coral/20'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${profile?.subscription_status === 'active' ? 'bg-lime animate-pulse' : 'bg-coral'}`} />
          <span className="text-white font-medium text-sm">
            Subscription: <span className="capitalize">{profile?.subscription_status || 'Inactive'}</span>
          </span>
          <Badge variant={profile?.subscription_status === 'active' ? 'lime' : 'coral'}>
            {profile?.subscription_plan || 'No plan'}
          </Badge>
        </div>
        {profile?.subscription_status !== 'active' && (
          <Link href="/subscribe" className="text-xs font-semibold text-white bg-coral/80 hover:bg-coral px-4 py-2 rounded-full transition-all">
            Activate Subscription
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Scores Logged', value: scores.length, max: '/5', icon: ClipboardList, color: 'text-lime' },
          { label: 'Avg Score', value: avgScore || '—', max: '', icon: TrendingUp, color: 'text-lime' },
          { label: 'Total Won', value: `₹${totalWon.toFixed(2)}`, max: '', icon: Trophy, color: 'text-yellow-400' },
          { label: 'Charity %', value: `${profile?.charity_percentage || 10}%`, max: '', icon: Heart, color: 'text-coral' },
        ].map(({ label, value, max, icon: Icon, color }) => (
          <Card key={label} className="text-center">
            <Icon size={18} className={`${color} mx-auto mb-2`} />
            <p className={`text-2xl font-black ${color}`} style={{ fontFamily: 'var(--font-mono)' }}>
              {value}{max}
            </p>
            <p className="text-white/40 text-xs mt-1">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Scores */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>My Scores</h2>
            <Link href="/dashboard/scores" className="text-xs text-lime hover:text-lime/80 flex items-center gap-1">
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          {scores.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList size={28} className="text-white/10 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No scores yet</p>
              <Link href="/dashboard/scores" className="text-xs text-lime mt-2 block">Add your first score →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((sc, i) => (
                <div key={sc.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-white/20 text-xs font-mono w-4">{i + 1}</span>
                    <div>
                      <span className="text-white text-sm font-semibold">{sc.score} pts</span>
                      <p className="text-white/30 text-xs">{format(new Date(sc.played_at), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                  <div className="score-bubble bg-lime/10 border border-lime/20 w-10 h-10 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                    <span className="text-lime font-bold">{sc.score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Latest draw results */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>Latest Draw</h2>
            <Link href="/dashboard/draws" className="text-xs text-lime hover:text-lime/80 flex items-center gap-1">
              All draws <ArrowRight size={12} />
            </Link>
          </div>
          {latestDraw ? (
            <div>
              <p className="text-white/40 text-xs mb-4 flex items-center gap-1.5">
                <Calendar size={12} />
                {format(new Date(latestDraw.draw_month), 'MMMM yyyy')}
              </p>
              <div className="flex gap-2 mb-4">
                {latestDraw.winning_numbers.map(n => (
                  <div key={n} className="number-badge">{n}</div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Prize Pool</span>
                  <span className="text-lime font-mono font-bold">₹{latestDraw.prize_pool_total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Jackpot (5-match)</span>
                  <span className="text-white font-mono">₹{latestDraw.prize_pool_5match.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy size={28} className="text-white/10 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No draw results yet</p>
            </div>
          )}
        </Card>

        {/* My winnings */}
        <Card className="md:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>My Winnings</h2>
          </div>
          {wins.length === 0 ? (
            <div className="text-center py-6">
              <Trophy size={28} className="text-white/10 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No wins yet — your next score entry could change that!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-white/30 pb-3 font-medium text-xs">Draw</th>
                    <th className="text-left text-white/30 pb-3 font-medium text-xs">Tier</th>
                    <th className="text-right text-white/30 pb-3 font-medium text-xs">Amount</th>
                    <th className="text-right text-white/30 pb-3 font-medium text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {wins.map(w => (
                    <tr key={w.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 text-white/60">{w.draw ? format(new Date((w.draw as Draw).draw_month), 'MMM yyyy') : '—'}</td>
                      <td className="py-3 text-white font-semibold">{w.prize_tier}</td>
                      <td className="py-3 text-right text-lime font-mono font-bold">₹{Number(w.prize_amount).toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <Badge variant={w.payment_status === 'paid' ? 'lime' : 'gold'}>
                          {w.payment_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
