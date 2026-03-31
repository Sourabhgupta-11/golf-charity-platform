'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'react-hot-toast'
import { Plus, Trash2, ClipboardList, Info } from 'lucide-react'
import type { GolfScore } from '@/types'
import { format } from 'date-fns'

export default function ScoresPage() {
  const { profile } = useAuth()
  const [scores, setScores] = useState<GolfScore[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    score: '',
    played_at: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const fetchScores = useCallback(async () => {
    if (!profile?.id) return
    const { data, error } = await supabase
      .from('golf_scores')
      .select('*')
      .eq('user_id', profile.id)
      .order('played_at', { ascending: false })
    if (!error) setScores((data as GolfScore[]) || [])
  }, [profile?.id])

  useEffect(() => { fetchScores() }, [fetchScores])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    const scoreNum = parseInt(form.score)
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 45) {
      toast.error('Score must be between 1 and 45')
      return
    }
    if (profile.subscription_status !== 'active') {
      toast.error('Active subscription required to log scores')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('golf_scores').insert({
        user_id: profile.id,
        score: scoreNum,
        played_at: form.played_at,
        notes: form.notes.trim() || null,
      })
      if (error) throw error
      toast.success('Score added!')
      setForm({ score: '', played_at: new Date().toISOString().split('T')[0], notes: '' })
      setShowForm(false)
      await fetchScores()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add score')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this score?')) return
    const { error } = await supabase.from('golf_scores').delete().eq('id', id)
    if (error) { toast.error('Failed to delete score'); return }
    toast.success('Score removed')
    await fetchScores()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
            My Scores
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Your 5 most recent Stableford scores are your draw entries
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? 'ghost' : 'primary'}
          size="sm"
        >
          <Plus size={14} />{showForm ? 'Cancel' : 'Add Score'}
        </Button>
      </div>

      {/* Info callout */}
      <div className="glass rounded-2xl p-4 mb-6 flex gap-3">
        <Info size={16} className="text-lime flex-shrink-0 mt-0.5" />
        <p className="text-white/50 text-sm leading-relaxed">
          Only your <strong className="text-white">5 most recent scores</strong> are stored.
          Adding a new score automatically removes the oldest one.
          Scores must be in Stableford format (1–45 points).
        </p>
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="mb-6 border border-lime/20">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Add Score
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Stableford Score"
                type="number"
                min="1"
                max="45"
                placeholder="e.g. 34"
                value={form.score}
                onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
                hint="Must be between 1 and 45"
                required
              />
              <Input
                label="Date Played"
                type="date"
                value={form.played_at}
                onChange={e => setForm(f => ({ ...f, played_at: e.target.value }))}
                required
              />
            </div>
            <Input
              label="Notes (optional)"
              placeholder="e.g. Club championship round"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
            <Button type="submit" loading={loading} fullWidth>
              Save Score
            </Button>
          </form>
        </Card>
      )}

      {/* Scores list */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Score History
          </h2>
          <span className="text-white/30 text-sm">{scores.length}/5</span>
        </div>

        {scores.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList size={36} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No scores logged yet</p>
            <p className="text-white/20 text-xs mt-1">
              Add your first Stableford score to enter the draw
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scores.map((sc, i) => (
              <div
                key={sc.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  i === 0
                    ? 'bg-lime/8 border border-lime/15'
                    : 'bg-white/3 border border-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/30 text-xs font-mono">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {format(new Date(sc.played_at), 'EEEE, dd MMM yyyy')}
                    </p>
                    {sc.notes && (
                      <p className="text-white/30 text-xs">{sc.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-black text-lime" style={{ fontFamily: 'var(--font-mono)' }}>
                      {sc.score}
                    </p>
                    <p className="text-white/30 text-xs">pts</p>
                  </div>
                  <button
                    onClick={() => handleDelete(sc.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-coral hover:bg-coral/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Draw numbers summary */}
      {scores.length > 0 && (
        <Card className="mt-4 border border-lime/10">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-4">
            Your Draw Numbers
          </p>
          <div className="flex gap-2 flex-wrap">
            {scores.map(sc => (
              <div key={sc.id} className="number-badge">{sc.score}</div>
            ))}
          </div>
          <p className="text-white/30 text-xs mt-4">
            These are your active numbers for the next monthly draw.
          </p>
        </Card>
      )}
    </div>
  )
}
