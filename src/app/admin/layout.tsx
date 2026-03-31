'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Users, Trophy, Heart, BarChart2, ShieldCheck, LogOut, Loader2 } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Overview', icon: BarChart2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/draws', label: 'Draw Engine', icon: Trophy },
  { href: '/admin/charities', label: 'Charities', icon: Heart },
  { href: '/admin/winners', label: 'Winners', icon: ShieldCheck },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/auth/login')
      return
    }
    // Non-admins must not access admin panel
    if (profile && profile.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-lime" size={32} />
      </div>
    )
  }

  if (profile.role !== 'admin') return null

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 p-6 fixed h-full overflow-y-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-lime flex items-center justify-center">
            <span className="text-ink font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>G</span>
          </div>
          <div>
            <span className="text-white font-semibold block" style={{ fontFamily: 'var(--font-display)' }}>Greenloop</span>
            <span className="text-lime text-xs font-medium">Admin Panel</span>
          </div>
        </div>

        {/* Admin badge */}
        <div className="rounded-xl p-3 mb-4 bg-lime/10 border border-lime/20">
          <p className="text-xs font-semibold text-lime mb-0.5">Administrator</p>
          <p className="text-xs text-white/40 truncate">{profile.email}</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active ? 'bg-lime/15 text-lime font-semibold' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}>
                <Icon size={16} />{label}
              </Link>
            )
          })}
        </nav>

        <button onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:text-coral hover:bg-coral/5 transition-all w-full mt-4">
          <LogOut size={16} />Sign Out
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 flex justify-around py-3 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-1 text-xs transition-colors ${
                active ? 'text-lime' : 'text-white/40 hover:text-white'
              }`}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <main className="flex-1 md:ml-64 p-4 md:p-10 pb-24 md:pb-10">
        {children}
      </main>
    </div>
  )
}
