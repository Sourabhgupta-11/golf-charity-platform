'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { toast } from 'react-hot-toast'
import { Users, Search, Edit2, Save, X } from 'lucide-react'
import type { Profile } from '@/types'
import { format } from 'date-fns'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [filtered, setFiltered] = useState<Profile[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Profile>>({})

const fetchUsers = async () => {
  setLoading(true);

  // 1. Fetch profiles only
  const { data: usersData, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Users fetch error:", error);
    setLoading(false);
    return;
  }

  if (!usersData) {
    setUsers([]);
    setFiltered([]);
    setLoading(false);
    return;
  }

  // 2. Extract charity IDs
  const charityIds = usersData
    .map(u => u.charity_id)
    .filter(Boolean);

  // 3. Fetch charities separately
  const { data: charities } = await supabase
    .from('charities')
    .select('id, name')
    .in('id', charityIds);

  // 4. Merge manually
  const merged = usersData.map(user => ({
    ...user,
    charity: charities?.find(c => c.id === user.charity_id),
  }));

  setUsers(merged as Profile[]);
  setFiltered(merged as Profile[]);
  setLoading(false);
};

  useEffect(() => { fetchUsers() }, [])

  useEffect(() => {
    const q = query.toLowerCase()
    setFiltered(q ? users.filter(u => u.full_name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) : users)
  }, [query, users])

  const startEdit = (user: Profile) => {
    setEditing(user.id)
    setEditData({ full_name: user.full_name, subscription_status: user.subscription_status, role: user.role })
  }

  const saveEdit = async (userId: string) => {
    try {
      const { error } = await supabase.from('profiles').update(editData).eq('id', userId)
      if (error) throw error
      toast.success('User updated')
      setEditing(null)
      fetchUsers()
    } catch {
      toast.error('Update failed')
    }
  }

  const statusColor: Record<string, 'lime' | 'coral' | 'muted' | 'gold'> = {
    active: 'lime', cancelled: 'coral', inactive: 'muted', past_due: 'gold'
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>Users</h1>
          <p className="text-white/40 text-sm mt-1">{users.length} total registered users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input type="text" placeholder="Search by name or email…"
          value={query} onChange={e => setQuery(e.target.value)}
          className="input-dark w-full pl-10 pr-4 py-3 text-sm" />
      </div>

      <Card padding="none">
        <div className="table-responsive">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Name / Email', 'Status', 'Plan', 'Role', 'Charity %', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left text-white/30 text-xs uppercase tracking-wide py-4 px-4 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 rounded shimmer" /></td></tr>
                ))
              ) : filtered.map(user => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    {editing === user.id ? (
                      <input value={editData.full_name || ''} onChange={e => setEditData(d => ({ ...d, full_name: e.target.value }))}
                        className="input-dark px-2 py-1 text-sm w-full" />
                    ) : (
                      <div>
                        <p className="text-white font-medium">{user.full_name}</p>
                        <p className="text-white/40 text-xs">{user.email}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing === user.id ? (
                      <select value={editData.subscription_status}
                        onChange={e => setEditData(d => ({ ...d, subscription_status: e.target.value as Profile['subscription_status'] }))}
                        className="input-dark px-2 py-1 text-sm">
                        {['active', 'inactive', 'cancelled', 'past_due'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    ) : (
                      <Badge variant={statusColor[user.subscription_status] || 'muted'}>{user.subscription_status}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/60 capitalize">{user.subscription_plan || '—'}</td>
                  <td className="px-4 py-3">
                    {editing === user.id ? (
                      <select value={editData.role}
                        onChange={e => setEditData(d => ({ ...d, role: e.target.value as 'subscriber' | 'admin' }))}
                        className="input-dark px-2 py-1 text-sm">
                        <option value="subscriber">subscriber</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span className={user.role === 'admin' ? 'text-lime font-semibold' : 'text-white/50'}>{user.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/60">{user.charity_percentage}%</td>
                  <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">{format(new Date(user.created_at), 'dd MMM yy')}</td>
                  <td className="px-4 py-3">
                    {editing === user.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(user.id)} className="text-lime hover:text-lime/80"><Save size={14} /></button>
                        <button onClick={() => setEditing(null)} className="text-white/40 hover:text-white"><X size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(user)} className="text-white/30 hover:text-lime transition-colors"><Edit2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
