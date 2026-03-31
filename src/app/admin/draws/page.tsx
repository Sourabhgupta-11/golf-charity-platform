'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { toast } from 'react-hot-toast'
import { Trophy, Play, Send, RefreshCw, Zap, ChevronDown } from 'lucide-react'
import type { Draw } from '@/types'
import { format } from 'date-fns'
import { generateRandomDraw, generateAlgorithmicDraw, calculatePrizePools, countMatches, getPrizeTier } from '@/lib/draw-engine'

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [publishing, setPublishing] = useState<string | null>(null)

  // New draw form
  const [drawType, setDrawType] = useState<'random' | 'algorithmic'>('random')
  const [drawMonth, setDrawMonth] = useState(new Date().toISOString().slice(0, 7) + '-01')
  const [simResult, setSimResult] = useState<{ numbers: number[]; pools: ReturnType<typeof calculatePrizePools> } | null>(null)

  const fetchDraws = async () => {
    const { data } = await supabase.from('draws').select('*').order('draw_month', { ascending: false }).limit(12)
    setDraws((data as Draw[]) || [])
    setLoading(false)
  }

  useEffect(() => { fetchDraws() }, [])

  const runSimulation = async () => {
    setSimulating(true)
    try {
      let numbers: number[]

      if (drawType === 'algorithmic') {
        // Fetch all current user scores
        const { data: scores } = await supabase.from('golf_scores').select('score')
        const allScores = (scores || []).map((s: { score: number }) => s.score)
        numbers = generateAlgorithmicDraw(allScores, 'most')
      } else {
        numbers = generateRandomDraw()
      }

      // Get active subscriber count to estimate pool
      const { count } = await supabase.from('profiles')
        .select('*', { count: 'exact', head: true }).eq('subscription_status', 'active')
      const monthlyRevenue = (count || 0) * 9.99 * 0.7 // 70% to prize pool
      const pools = calculatePrizePools(monthlyRevenue)

      setSimResult({ numbers, pools })
      toast.success('Simulation complete!')
    } catch (e) {
      toast.error('Simulation failed')
    } finally {
      setSimulating(false)
    }
  }

  const saveAndPublish = async (publish: boolean) => {
    if (!simResult) { toast.error('Run a simulation first'); return }
    const drawId = publishing || ''
    setPublishing('saving')

    try {
      const payload = {
        draw_month: drawMonth,
        draw_type: drawType,
        status: publish ? 'published' : 'simulated',
        winning_numbers: simResult.numbers,
        prize_pool_total: simResult.pools.fiveMatch + simResult.pools.fourMatch + simResult.pools.threeMatch,
        prize_pool_5match: simResult.pools.fiveMatch,
        prize_pool_4match: simResult.pools.fourMatch,
        prize_pool_3match: simResult.pools.threeMatch,
        ...(publish && { published_at: new Date().toISOString() }),
      }

      const { data: draw, error } = await supabase.from('draws').insert(payload).select().single()
      if (error) throw error

      if (publish) {
        // Calculate entries for all active subscribers
        const { data: profiles } = await supabase.from('profiles')
          .select('id').eq('subscription_status', 'active')

        for (const profile of profiles || []) {
          const { data: scores } = await supabase.from('golf_scores')
            .select('score').eq('user_id', profile.id).order('played_at', { ascending: false }).limit(5)
          const userNums = (scores || []).map((s: { score: number }) => s.score)
          if (userNums.length === 0) continue

          const matchCount = countMatches(userNums, simResult.numbers)
          const prizeTier = getPrizeTier(matchCount)
          const prizeAmount = prizeTier === '5-match' ? simResult.pools.fiveMatch :
            prizeTier === '4-match' ? simResult.pools.fourMatch :
            prizeTier === '3-match' ? simResult.pools.threeMatch : 0

          const entry = {
            draw_id: draw.id,
            user_id: profile.id,
            numbers_entered: userNums,
            match_count: matchCount,
            prize_tier: prizeTier,
            prize_amount: prizeTier ? prizeAmount : 0,
          }

          await supabase.from('draw_entries').insert(entry)

          if (prizeTier) {
            await supabase.from('winners').insert({
              draw_id: draw.id,
              user_id: profile.id,
              prize_tier: prizeTier,
              prize_amount: prizeAmount,
            })
          }
        }

        toast.success('Draw published and entries processed!')
      } else {
        toast.success('Draw saved as simulation')
      }

      setSimResult(null)
      fetchDraws()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save draw')
    } finally {
      setPublishing(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>Draw Engine</h1>
        <p className="text-white/40 text-sm mt-1">Configure, simulate, and publish monthly draws</p>
      </div>

      {/* New Draw */}
      <Card className="mb-8 border border-lime/15">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <Trophy size={18} className="text-lime" />Configure New Draw
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm text-white/70 mb-2">Draw Month</label>
            <input type="month" value={drawMonth.slice(0, 7)}
              onChange={e => setDrawMonth(e.target.value + '-01')}
              className="input-dark w-full px-4 py-3 text-sm" />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">Draw Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['random', 'algorithmic'] as const).map(t => (
                <button key={t} onClick={() => setDrawType(t)}
                  className={`p-3 rounded-xl border text-sm font-medium capitalize transition-all ${
                    drawType === t ? 'border-lime/50 bg-lime/10 text-lime' : 'border-white/10 text-white/50 hover:border-white/20'
                  }`}>
                  {t === 'algorithmic' ? <><Zap size={12} className="inline mr-1" />Algorithmic</> : 'Random'}
                </button>
              ))}
            </div>
            <p className="text-white/30 text-xs mt-2">
              {drawType === 'algorithmic' ? 'Weighted by most frequent scores in the platform' : 'Standard lottery-style random draw'}
            </p>
          </div>
        </div>

        {/* Simulation result */}
        {simResult && (
          <div className="glass rounded-2xl p-5 mb-6 border border-lime/20">
            <p className="text-lime text-xs uppercase tracking-widest mb-3 font-medium">Simulation Result</p>
            <div className="flex gap-2 mb-4">
              {simResult.numbers.map(n => <div key={n} className="number-badge">{n}</div>)}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '5-match Jackpot', amount: simResult.pools.fiveMatch },
                { label: '4-match', amount: simResult.pools.fourMatch },
                { label: '3-match', amount: simResult.pools.threeMatch },
              ].map(t => (
                <div key={t.label} className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white/40 text-xs mb-1">{t.label}</p>
                  <p className="text-lime font-bold text-sm font-mono">£{t.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <Button onClick={runSimulation} loading={simulating} variant="secondary">
            <RefreshCw size={14} />Run Simulation
          </Button>
          {simResult && (
            <>
              <Button onClick={() => saveAndPublish(false)} loading={publishing === 'saving'} variant="secondary">
                Save as Draft
              </Button>
              <Button onClick={() => saveAndPublish(true)} loading={publishing === 'saving'}>
                <Send size={14} />Publish Draw
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Draw history */}
      <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Draw History</h2>
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-24 glass rounded-2xl shimmer" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {draws.map(draw => (
            <Card key={draw.id}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold">{format(new Date(draw.draw_month), 'MMMM yyyy')}</span>
                    <Badge variant={draw.status === 'published' ? 'lime' : draw.status === 'simulated' ? 'gold' : 'muted'}>
                      {draw.status}
                    </Badge>
                  </div>
                  <div className="flex gap-1.5">
                    {draw.winning_numbers.map(n => (
                      <div key={n} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono text-white/70">
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lime font-mono font-bold">£{Number(draw.prize_pool_total).toFixed(2)}</p>
                  <p className="text-white/30 text-xs">prize pool</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
