'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { toast } from 'react-hot-toast'
import { Heart, Plus, Edit2, Trash2, X, Save, Star } from 'lucide-react'
import type { Charity } from '@/types'

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  short_description: '',
  image_url: '',
  website_url: '',
  is_featured: false,
}

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchCharities = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('charities')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setCharities((data as Charity[]) || [])
    } catch (err) {
      console.error('Charities fetch error:', err)
      toast.error('Failed to load charities')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCharities() }, [fetchCharities])

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(null)
    setShowForm(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim() || !form.description.trim()) {
      toast.error('Name, slug, and description are required')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase
          .from('charities')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', editing)
        if (error) throw error
        toast.success('Charity updated!')
      } else {
        const { error } = await supabase
          .from('charities')
          .insert({ ...form, is_active: true })
        if (error) throw error
        toast.success('Charity created!')
      }
      resetForm()
      await fetchCharities()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (charity: Charity) => {
    setEditing(charity.id)
    setForm({
      name: charity.name,
      slug: charity.slug,
      description: charity.description,
      short_description: charity.short_description || '',
      image_url: charity.image_url || '',
      website_url: charity.website_url || '',
      is_featured: charity.is_featured,
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleActive = async (charity: Charity) => {
    const action = charity.is_active ? 'deactivate' : 'activate'
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${charity.name}"?`)) return
    const { error } = await supabase
      .from('charities')
      .update({ is_active: !charity.is_active })
      .eq('id', charity.id)
    if (error) { toast.error('Failed to update'); return }
    toast.success(`Charity ${action}d`)
    fetchCharities()
  }

  const handleToggleFeatured = async (charity: Charity) => {
    const { error } = await supabase
      .from('charities')
      .update({ is_featured: !charity.is_featured })
      .eq('id', charity.id)
    if (error) { toast.error('Failed to update'); return }
    fetchCharities()
  }

  const field = (key: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>Charities</h1>
          <p className="text-white/40 text-sm mt-1">Manage charity listings and content</p>
        </div>
        <Button
          onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm) }}
          variant={showForm ? 'ghost' : 'primary'}
          size="sm"
        >
          {showForm ? <><X size={14} />Cancel</> : <><Plus size={14} />Add Charity</>}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-8 border border-lime/20">
          <h2 className="text-lg font-bold mb-5" style={{ fontFamily: 'var(--font-display)' }}>
            {editing ? 'Edit Charity' : 'New Charity'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Charity Name"
                placeholder="e.g. Greenside Foundation"
                value={form.name}
                onChange={field('name')}
                required
              />
              <Input
                label="Slug"
                placeholder="e.g. greenside-foundation"
                value={form.slug}
                onChange={field('slug')}
                required
                hint="URL-friendly identifier (lowercase, hyphens only)"
              />
            </div>
            <Input
              label="Short Description"
              placeholder="One-line summary (shown on listing page)"
              value={form.short_description}
              onChange={field('short_description')}
            />
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Full Description *</label>
              <textarea
                value={form.description}
                onChange={field('description')}
                rows={4}
                required
                className="input-dark w-full px-4 py-3 text-sm resize-none"
                placeholder="Full description shown on the charity profile page…"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Image URL"
                placeholder="https://…"
                value={form.image_url}
                onChange={field('image_url')}
              />
              <Input
                label="Website URL"
                placeholder="https://…"
                value={form.website_url}
                onChange={field('website_url')}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))}
                className="w-4 h-4 accent-lime"
              />
              <span className="text-sm text-white/70">Feature on homepage</span>
            </label>
            <div className="flex gap-3">
              <Button type="submit" loading={saving}>
                <Save size={14} />{editing ? 'Save Changes' : 'Create Charity'}
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Charities list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 glass rounded-2xl shimmer" />)}
        </div>
      ) : charities.length === 0 ? (
        <Card className="text-center py-12">
          <Heart size={36} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No charities yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {charities.map(charity => (
            <Card key={charity.id} className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {charity.image_url && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={charity.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-white font-semibold">{charity.name}</span>
                    {charity.is_featured && (
                      <Badge variant="lime"><Star size={10} />Featured</Badge>
                    )}
                    {!charity.is_active && (
                      <Badge variant="coral">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-white/40 text-xs">{charity.short_description}</p>
                  <p className="text-lime text-xs font-mono mt-1">
                    ₹{Number(charity.total_raised).toFixed(2)} raised
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleFeatured(charity)}
                  title={charity.is_featured ? 'Remove from featured' : 'Feature on homepage'}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    charity.is_featured
                      ? 'text-lime bg-lime/15'
                      : 'text-white/20 hover:text-lime hover:bg-lime/10'
                  }`}
                >
                  <Star size={14} />
                </button>
                <button
                  onClick={() => handleEdit(charity)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-lime hover:bg-lime/10 transition-all"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleToggleActive(charity)}
                  title={charity.is_active ? 'Deactivate charity' : 'Activate charity'}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    charity.is_active
                      ? 'text-white/20 hover:text-coral hover:bg-coral/10'
                      : 'text-coral/50 hover:text-lime hover:bg-lime/10'
                  }`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
