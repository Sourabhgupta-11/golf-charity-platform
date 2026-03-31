'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { toast } from 'react-hot-toast'
import { Heart, Plus, Edit2, Trash2, X, Save, Star } from 'lucide-react'
import type { Charity } from '@/types'

const emptyForm = { name: '', slug: '', description: '', short_description: '', image_url: '', website_url: '', is_featured: false }

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchCharities = async () => {
    const { data } = await supabase.from('charities').select('*').order('created_at', { ascending: false })
    setCharities((data as Charity[]) || [])
  }

  useEffect(() => { fetchCharities() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('charities').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing)
        if (error) throw error
        toast.success('Charity updated!')
      } else {
        const { error } = await supabase.from('charities').insert({ ...form, is_active: true })
        if (error) throw error
        toast.success('Charity created!')
      }
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm)
      fetchCharities()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
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
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this charity? This cannot be undone.')) return
    await supabase.from('charities').update({ is_active: false }).eq('id', id)
    toast.success('Charity deactivated')
    fetchCharities()
  }

  const handleToggleFeatured = async (charity: Charity) => {
    await supabase.from('charities').update({ is_featured: !charity.is_featured }).eq('id', charity.id)
    fetchCharities()
  }

  const f = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>Charities</h1>
          <p className="text-white/40 text-sm mt-1">Manage charity listings and content</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm) }}
          variant={showForm ? 'ghost' : 'primary'} size="sm">
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
              <Input label="Charity Name" placeholder="e.g. Greenside Foundation" value={form.name} onChange={f('name')} required />
              <Input label="Slug" placeholder="e.g. greenside-foundation" value={form.slug} onChange={f('slug')} required
                hint="URL-friendly identifier (lowercase, hyphens only)" />
            </div>
            <Input label="Short Description" placeholder="One-line summary" value={form.short_description} onChange={f('short_description')} />
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Full Description</label>
              <textarea value={form.description} onChange={f('description')} rows={4} required
                className="input-dark w-full px-4 py-3 text-sm resize-none"
                placeholder="Full description shown on the charity profile page…" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Image URL" placeholder="https://…" value={form.image_url} onChange={f('image_url')} />
              <Input label="Website URL" placeholder="https://…" value={form.website_url} onChange={f('website_url')} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_featured}
                onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))}
                className="w-4 h-4 accent-lime" />
              <span className="text-sm text-white/70">Feature on homepage</span>
            </label>
            <Button type="submit" loading={saving}>
              <Save size={14} />{editing ? 'Save Changes' : 'Create Charity'}
            </Button>
          </form>
        </Card>
      )}

      {/* Charities list */}
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
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white font-semibold">{charity.name}</span>
                  {charity.is_featured && <Badge variant="lime"><Star size={10} />Featured</Badge>}
                  {!charity.is_active && <Badge variant="coral">Inactive</Badge>}
                </div>
                <p className="text-white/40 text-xs">{charity.short_description}</p>
                <p className="text-lime text-xs font-mono mt-1">£{Number(charity.total_raised).toFixed(2)} raised</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleToggleFeatured(charity)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${charity.is_featured ? 'text-lime bg-lime/15' : 'text-white/20 hover:text-lime hover:bg-lime/10'}`}>
                <Star size={14} />
              </button>
              <button onClick={() => handleEdit(charity)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-lime hover:bg-lime/10 transition-all">
                <Edit2 size={14} />
              </button>
              <button onClick={() => handleDelete(charity.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-coral hover:bg-coral/10 transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
