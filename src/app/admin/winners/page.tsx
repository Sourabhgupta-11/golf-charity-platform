'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import { ShieldCheck, CheckCircle, XCircle, IndianRupee, ExternalLink, RefreshCw } from 'lucide-react'
import type { Winner, Draw } from '@/types'
import { format } from 'date-fns'

interface WinnerRow extends Omit<Winner, 'draw'> {
  draw: Pick<Draw, 'draw_month' | 'prize_pool_total'> | null
  winner_name: string
  winner_email: string
}

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<WinnerRow[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchWinners = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch winners without join — joins across tables with RLS can cause issues
      const { data: winnersData, error: wErr } = await supabase
        .from('winners')
        .select('*')
        .order('created_at', { ascending: false })

      if (wErr) throw wErr
      if (!winnersData || winnersData.length === 0) {
        setWinners([])
        return
      }

      // Fetch related profiles and draws in parallel
      const userIds = [...new Set(winnersData.map(w => w.user_id))]
      const drawIds = [...new Set(winnersData.map(w => w.draw_id))]

      const [{ data: profiles }, { data: draws }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', userIds),
        supabase.from('draws').select('id, draw_month, prize_pool_total').in('id', drawIds),
      ])

      const enriched: WinnerRow[] = winnersData.map(w => {
        const profile = profiles?.find(p => p.id === w.user_id)
        const draw = draws?.find(d => d.id === w.draw_id)
        return {
          ...w,
          draw: draw || null,
          winner_name: profile?.full_name || 'Unknown',
          winner_email: profile?.email || '—',
        }
      })

      setWinners(enriched)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load winners'
      console.error('Winners fetch error:', err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWinners() }, [fetchWinners])

  const updateStatus = async (
    id: string,
    field: 'verification_status' | 'payment_status',
    value: string
  ) => {
    setProcessing(id + field)
    try {
      const updates: Record<string, unknown> = { [field]: value }
      if (field === 'verification_status') {
        updates.verified_at = value === 'approved' ? new Date().toISOString() : null
      }
      if (field === 'payment_status' && value === 'paid') {
        updates.paid_at = new Date().toISOString()
      }

      const { error } = await supabase.from('winners').update(updates).eq('id', id)
      if (error) throw error
      toast.success(`Updated to "${value}"`)
      await fetchWinners()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setProcessing(null)
    }
  }

  const addNote = async (id: string) => {
    const note = prompt('Add admin note:')
    if (!note?.trim()) return
    const { error } = await supabase.from('winners').update({ admin_notes: note.trim() }).eq('id', id)
    if (error) { toast.error('Failed to save note'); return }
    toast.success('Note saved')
    fetchWinners()
  }

  const filtered = filter === 'all'
    ? winners
    : winners.filter(w => w.verification_status === filter)

  const tierColor = (tier: string): 'gold' | 'lime' | 'slate' =>
    tier === '5-match' ? 'gold' : tier === '4-match' ? 'lime' : 'slate'

  const counts = {
    pending: winners.filter(w => w.verification_status === 'pending').length,
    approved: winners.filter(w => w.verification_status === 'approved').length,
    rejected: winners.filter(w => w.verification_status === 'rejected').length,
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
            Winner Verification
          </h1>
          <p className="text-white/40 text-sm mt-1">Review proofs and manage payouts</p>
        </div>
        <button
          onClick={fetchWinners}
          disabled={loading}
          className="flex items-center gap-2 glass border border-white/10 text-white/60 hover:text-white px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="glass rounded-2xl p-4 mb-6 border border-coral/20">
          <p className="text-coral text-sm">{error}</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-lime text-ink' : 'glass text-white/50 hover:text-white'
            }`}
          >
            {f}
            {f !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">({counts[f]})</span>
            )}
            {f === 'all' && (
              <span className="ml-1.5 text-xs opacity-70">({winners.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Winners list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-32 glass rounded-2xl shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <ShieldCheck size={36} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30">No winners in this category</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(winner => (
            <Card key={winner.id}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant={tierColor(winner.prize_tier)}>{winner.prize_tier}</Badge>
                    <Badge variant={
                      winner.verification_status === 'approved' ? 'lime' :
                      winner.verification_status === 'rejected' ? 'coral' : 'gold'
                    }>
                      {winner.verification_status}
                    </Badge>
                    <Badge variant={winner.payment_status === 'paid' ? 'lime' : 'muted'}>
                      {winner.payment_status}
                    </Badge>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-white/30 text-xs mb-0.5">Winner</p>
                      <p className="text-white text-sm font-medium">{winner.winner_name}</p>
                      <p className="text-white/40 text-xs">{winner.winner_email}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs mb-0.5">Draw</p>
                      <p className="text-white text-sm">
                        {winner.draw
                          ? format(new Date(winner.draw.draw_month), 'MMMM yyyy')
                          : '—'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs mb-0.5">Prize Amount</p>
                      <p className="text-2xl font-black text-lime" style={{ fontFamily: 'var(--font-mono)' }}>
                        ₹{Number(winner.prize_amount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs mb-0.5">Submitted</p>
                      <p className="text-white/60 text-sm">
                        {format(new Date(winner.created_at), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Admin note */}
                  {winner.admin_notes && (
                    <div className="mt-3 glass rounded-xl p-3">
                      <p className="text-white/30 text-xs mb-1">Admin Note</p>
                      <p className="text-white/60 text-sm">{winner.admin_notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 min-w-[160px]">
                  {winner.proof_url && (
                    <a
                      href={winner.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 glass border border-white/10 text-white/60 hover:text-lime text-xs px-3 py-2 rounded-xl transition-all"
                    >
                      <ExternalLink size={12} />View Proof
                    </a>
                  )}

                  {winner.verification_status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(winner.id, 'verification_status', 'approved')}
                        loading={processing === winner.id + 'verification_status'}
                        className="bg-lime/15 text-lime border border-lime/30 hover:bg-lime/25 rounded-xl"
                      >
                        <CheckCircle size={13} />Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(winner.id, 'verification_status', 'rejected')}
                        loading={processing === winner.id + 'verification_status'}
                        className="text-coral hover:bg-coral/10 border border-coral/20 rounded-xl"
                      >
                        <XCircle size={13} />Reject
                      </Button>
                    </>
                  )}

                  {winner.verification_status === 'approved' &&
                    winner.payment_status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(winner.id, 'payment_status', 'paid')}
                      loading={processing === winner.id + 'payment_status'}
                    >
                      <IndianRupee size={13} />Mark Paid
                    </Button>
                  )}

                  <button
                    onClick={() => addNote(winner.id)}
                    className="text-xs text-white/30 hover:text-white/60 text-left transition-colors mt-1"
                  >
                    + Add / edit note
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
