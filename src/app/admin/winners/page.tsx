'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import { ShieldCheck, CheckCircle, XCircle, IndianRupee, ExternalLink } from 'lucide-react'
import type { Winner, Profile, Draw } from '@/types'
import { format } from 'date-fns'

interface WinnerWithRelations extends Winner {
  profile: Profile
  draw: Draw
}

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<WinnerWithRelations[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchWinners = async () => {
  setLoading(true);

  // 1. Fetch winners only
  const { data: winnersData, error } = await supabase
    .from('winners')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Winners fetch error:", error);
    setLoading(false);
    return;
  }

  if (!winnersData) {
    setWinners([]);
    setLoading(false);
    return;
  }

  // 2. Extract IDs
  const userIds = winnersData.map(w => w.user_id);
  const drawIds = winnersData.map(w => w.draw_id);

  // 3. Fetch profiles separately
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  // 4. Fetch draws separately
  const { data: draws } = await supabase
    .from('draws')
    .select('id, draw_month, prize_pool_total')
    .in('id', drawIds);

  // 5. Merge manually
  const merged = winnersData.map(w => ({
    ...w,
    profile: profiles?.find(p => p.id === w.user_id),
    draw: draws?.find(d => d.id === w.draw_id),
  }));

  setWinners(merged as WinnerWithRelations[]);
  setLoading(false);
};

  useEffect(() => { fetchWinners() }, [])

  const updateStatus = async (id: string, field: 'verification_status' | 'payment_status', value: string) => {
    setProcessing(id + field)
    try {
      const updates: Record<string, unknown> = { [field]: value }
      if (field === 'verification_status') updates.verified_at = value === 'approved' ? new Date().toISOString() : null
      if (field === 'payment_status' && value === 'paid') updates.paid_at = new Date().toISOString()

      const { error } = await supabase.from('winners').update(updates).eq('id', id)
      if (error) throw error
      toast.success(`Status updated to ${value}`)
      fetchWinners()
    } catch {
      toast.error('Update failed')
    } finally {
      setProcessing(null)
    }
  }

  const addNote = async (id: string) => {
    const note = prompt('Add admin note:')
    if (!note) return
    await supabase.from('winners').update({ admin_notes: note }).eq('id', id)
    fetchWinners()
  }

  const filtered = filter === 'all' ? winners : winners.filter(w => w.verification_status === filter)

  const tierColors: Record<string, 'gold' | 'lime' | 'slate'> = {
    '5-match': 'gold',
    '4-match': 'lime',
    '3-match': 'slate',
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>Winner Verification</h1>
        <p className="text-white/40 text-sm mt-1">Review proofs and manage payouts</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-lime text-ink' : 'glass text-white/50 hover:text-white'
            }`}>
            {f}
            {f !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({winners.filter(w => w.verification_status === f).length})
              </span>
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
                {/* Left */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant={tierColors[winner.prize_tier] || 'slate'}>{winner.prize_tier}</Badge>
                    <Badge variant={winner.verification_status === 'approved' ? 'lime' : winner.verification_status === 'rejected' ? 'coral' : 'gold'}>
                      {winner.verification_status}
                    </Badge>
                    <Badge variant={winner.payment_status === 'paid' ? 'lime' : 'muted'}>
                      {winner.payment_status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div>
                      <p className="text-white/30 text-xs mb-0.5">Winner</p>
                      <p className="text-white text-sm font-medium">{winner.profile?.full_name}</p>
                      <p className="text-white/40 text-xs">{winner.profile?.email}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs mb-0.5">Draw</p>
                      <p className="text-white text-sm">
                        {winner.draw ? format(new Date(winner.draw.draw_month), 'MMMM yyyy') : '—'}
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
                      <p className="text-white/60 text-sm">{format(new Date(winner.created_at), 'dd MMM yyyy')}</p>
                    </div>
                  </div>

                  {winner.admin_notes && (
                    <div className="mt-3 glass rounded-xl p-3">
                      <p className="text-white/30 text-xs mb-1">Admin Note</p>
                      <p className="text-white/60 text-sm">{winner.admin_notes}</p>
                    </div>
                  )}
                </div>

                {/* Right — actions */}
                <div className="flex flex-col gap-2 min-w-[160px]">
                  {winner.proof_url && (
                    <a href={winner.proof_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 glass border border-white/10 text-white/60 hover:text-lime text-xs px-3 py-2 rounded-xl transition-all">
                      <ExternalLink size={12} />View Proof
                    </a>
                  )}

                  {winner.verification_status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(winner.id, 'verification_status', 'approved')}
                        loading={processing === winner.id + 'verification_status'}
                        className="bg-lime/15 text-lime border border-lime/30 hover:bg-lime/25 rounded-xl">
                        <CheckCircle size={13} />Approve
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(winner.id, 'verification_status', 'rejected')}
                        className="text-coral hover:bg-coral/10 border border-coral/20 rounded-xl">
                        <XCircle size={13} />Reject
                      </Button>
                    </>
                  )}

                  {winner.verification_status === 'approved' && winner.payment_status === 'pending' && (
                    <Button size="sm" onClick={() => updateStatus(winner.id, 'payment_status', 'paid')}
                      loading={processing === winner.id + 'payment_status'}>
                      <IndianRupee size={13} />Mark Paid
                    </Button>
                  )}

                  <button onClick={() => addNote(winner.id)}
                    className="text-xs text-white/30 hover:text-white/60 text-left transition-colors mt-1">
                    + Add note
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
