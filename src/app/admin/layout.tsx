'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Users, Trophy, Heart, BarChart2, ShieldCheck, LogOut, Loader2, Home } from 'lucide-react'

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

  const handleSignOut = async () => {
  await signOut();
  router.push('/auth/login');
};
useEffect(() => {
  if (loading) return;

  if (!user) {
    router.push('/auth/login');
    return;
  }

  if (!profile) return; // wait until profile loads

  if (profile.role !== 'admin') {
    router.push('/dashboard');
  }

}, [user, profile, loading, router]);
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
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 p-6 fixed h-full">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-lime flex items-center justify-center">
            <span className="text-ink font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>G</span>
          </div>
          <div>
            <span className="text-white font-semibold block" style={{ fontFamily: 'var(--font-display)' }}>Greenloop</span>
            <span className="text-lime text-xs">Admin Panel</span>
          </div>
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

        <div className="space-y-1">
          <button onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:text-coral hover:bg-coral/5 transition-all w-full">
            <LogOut size={16} />Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-6 md:p-10">{children}</main>
    </div>
  )
}
