'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { LayoutDashboard, ClipboardList, Heart, Trophy, Settings, LogOut, Loader2 } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/scores', label: 'My Scores', icon: ClipboardList },
  { href: '/dashboard/charity', label: 'My Charity', icon: Heart },
  { href: '/dashboard/draws', label: 'Draws & Wins', icon: Trophy },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

useEffect(() => {
  if (loading) return;

  if (!user) {
    router.push('/auth/login');
    return;
  }

  if (profile?.role === 'admin') {
    router.push('/admin');
  }

}, [user, profile, loading, router]);

if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-lime" size={32} />
    </div>
  );
}

if (!user) return null;

if (profile?.role === 'admin') return null;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 p-6 gap-4 fixed h-full">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-lime flex items-center justify-center flex-shrink-0">
            <span className="text-ink font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>G</span>
          </div>
          <span className="text-white font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Greenloop</span>
        </Link>

        {/* Subscription badge */}
        <div className={`rounded-xl p-3 mb-2 ${
          profile?.subscription_status === 'active' ? 'bg-lime/10 border border-lime/20' : 'bg-white/5 border border-white/10'
        }`}>
          <p className="text-xs font-semibold text-white/70 mb-0.5">
            {profile?.subscription_status === 'active' ? '✦ Active Subscriber' : 'Inactive'}
          </p>
          <p className="text-xs text-white/40 capitalize">{profile?.subscription_plan || 'No plan'}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active ? 'bg-lime/15 text-lime font-semibold' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}>
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <button onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:text-coral hover:bg-coral/5 transition-all">
          <LogOut size={16} />Sign Out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-6 md:p-10">
        {children}
      </main>
    </div>
  )
}
