'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Trophy, Upload, Check } from 'lucide-react'
import type { Draw, Winner, GolfScore } from '@/types'
import { format } from 'date-fns'

export default function DrawsPage() {
  const { profile } = useAuth()
  const [draws, setDraws] = useState<Draw[]>([])
  const [myWins, setMyWins] = useState<Winner[]>([])
  const [myScores, setMyScores] = useState<number[]>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    const fetchAll = async () => {
      setLoading(true)
      try {
        const [drawsRes, winsRes, scoresRes] = await Promise.all([
          supabase.from('draws').select('*').eq('status', 'published').order('draw_month', { ascending: false }),
          supabase.from('winners').select('*, draw:draws(*)').eq('user_id', profile.id),
          supabase.from('golf_scores').select('score').eq('user_id', profile.id).order('played_at', { ascending: false }).limit(5),
        ])
        setDraws((drawsRes.data as Draw[]) || [])
        setMyWins((winsRes.data as Winner[]) || [])
        setMyScores((scoresRes.data as GolfScore[])?.map(s => s.score) || [])
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [profile?.id])

  const handleProofUpload = async (winnerId: string, file: File) => {
    setUploading(winnerId)
    try {
      const ext = file.name.split('.').pop()
      const path = `proofs/${winnerId}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('winner-proofs')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('winner-proofs')
        .getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('winners')
        .update({ proof_url: publicUrl })
        .eq('id', winnerId)
      if (updateError) throw updateError

      alert('Proof uploaded! Awaiting admin verification.')
    } catch {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(null)
    }
  }

  const myWinMap = new Map(myWins.map(w => [w.draw_id, w]))

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
          Draws & Wins
        </h1>
        <p className="text-white/40 text-sm mt-1">Monthly draw results and your winnings</p>
      </div>

      {/* My winnings */}
      {myWins.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <Trophy size={18} className="text-yellow-400" />My Winnings
          </h2>
          <div className="space-y-3">
            {myWins.map(win => (
              <Card key={win.id} className="border border-yellow-400/20">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="gold">{win.prize_tier}</Badge>
                      <Badge variant={win.payment_status === 'paid' ? 'lime' : 'muted'}>
                        {win.payment_status}
                      </Badge>
                      <Badge variant={
                        win.verification_status === 'approved' ? 'lime' :
                        win.verification_status === 'rejected' ? 'coral' : 'muted'
                      }>
                        {win.verification_status}
                      </Badge>
                    </div>
                    <p className="text-3xl font-black text-yellow-400" style={{ fontFamily: 'var(--font-mono)' }}>
                      ₹{Number(win.prize_amount).toFixed(2)}
                    </p>
                  </div>

                  {win.verification_status === 'pending' && !win.proof_url && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={e => e.target.files?.[0] && handleProofUpload(win.id, e.target.files[0])}
                      />
                      <span className="flex items-center gap-2 bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-sm font-medium px-4 py-2 rounded-full hover:bg-yellow-400/25 transition-all">
                        {uploading === win.id
                          ? 'Uploading…'
                          : <><Upload size={14} />Upload Proof</>
                        }
                      </span>
                    </label>
                  )}
                  {win.proof_url && (
                    <span className="flex items-center gap-2 text-lime text-sm">
                      <Check size={14} />Proof uploaded
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Draw history */}
      <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
        Draw History
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-40 glass rounded-2xl shimmer" />)}
        </div>
      ) : draws.length === 0 ? (
        <Card className="text-center py-12">
          <Trophy size={36} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30">No draws published yet</p>
          <p className="text-white/20 text-xs mt-1">Check back soon!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {draws.map(draw => {
            const myWin = myWinMap.get(draw.id)
            const iWon = !!myWin

            return (
              <Card key={draw.id} className={iWon ? 'border border-yellow-400/20' : ''}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                      {format(new Date(draw.draw_month), 'MMMM yyyy')} Draw
                    </p>
                    {draw.published_at && (
                      <p className="text-white/30 text-xs">
                        Published {format(new Date(draw.published_at), 'dd MMM yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {iWon && <Badge variant="gold">🏆 You won!</Badge>}
                    <Badge variant="lime">Completed</Badge>
                  </div>
                </div>

                {/* Winning numbers — highlight user's matched scores */}
                <div className="mb-4">
                  <p className="text-white/30 text-xs mb-2">Winning numbers</p>
                  <div className="flex gap-2 flex-wrap">
                    {draw.winning_numbers.map(n => {
                      const matched = myScores.includes(n)
                      return (
                        <div
                          key={n}
                          className={`number-badge text-sm ${matched ? 'matched' : ''}`}
                          title={matched ? 'Your number matched!' : ''}
                        >
                          {n}
                        </div>
                      )
                    })}
                  </div>
                  {myScores.length > 0 && (
                    <p className="text-white/30 text-xs mt-2">
                      Your numbers: {myScores.join(', ')} —{' '}
                      {draw.winning_numbers.filter(n => myScores.includes(n)).length} match
                      {draw.winning_numbers.filter(n => myScores.includes(n)).length !== 1 ? 'es' : ''}
                    </p>
                  )}
                </div>

                {/* Prize tiers */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '5-match Jackpot', amount: draw.prize_pool_5match },
                    { label: '4-match', amount: draw.prize_pool_4match },
                    { label: '3-match', amount: draw.prize_pool_3match },
                  ].map(t => (
                    <div key={t.label} className="bg-white/3 rounded-xl p-3 text-center">
                      <p className="text-white/40 text-xs mb-1">{t.label}</p>
                      <p className="text-white font-bold text-sm font-mono">
                        ₹{Number(t.amount).toFixed(0)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
