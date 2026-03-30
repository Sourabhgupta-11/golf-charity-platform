'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X, ChevronRight } from 'lucide-react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'py-3 glass border-b border-white/5' : 'py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-lime flex items-center justify-center">
            <span className="text-ink font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>G</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Greenloop
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/charities" className="text-sm text-white/60 hover:text-white transition-colors">
            Charities
          </Link>
          <Link href="/how-it-works" className="text-sm text-white/60 hover:text-white transition-colors">
            How It Works
          </Link>
          {user && profile?.role === 'admin' && (
            <Link href="/admin" className="text-sm text-lime hover:text-lime/80 transition-colors">
              Admin
            </Link>
          )}
        </div>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2"
              >
                Sign in
              </Link>
              <Link
                href="/subscribe"
                className="flex items-center gap-1.5 bg-lime text-ink text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-lime/90 transition-all hover:shadow-lg hover:shadow-lime/20"
              >
                Join Now <ChevronRight size={14} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-white/70 hover:text-white" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass-light border-t border-white/5 mt-3 px-4 py-6 space-y-4">
          <Link href="/charities" className="block text-white/70 hover:text-white py-2" onClick={() => setOpen(false)}>Charities</Link>
          <Link href="/how-it-works" className="block text-white/70 hover:text-white py-2" onClick={() => setOpen(false)}>How It Works</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="block text-white py-2" onClick={() => setOpen(false)}>Dashboard</Link>
              {profile?.role === 'admin' && (
                <Link href="/admin" className="block text-lime py-2" onClick={() => setOpen(false)}>Admin</Link>
              )}
              <button onClick={handleSignOut} className="block text-white/50 py-2 w-full text-left">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block text-white/70 py-2" onClick={() => setOpen(false)}>Sign in</Link>
              <Link href="/subscribe" className="block bg-lime text-ink font-semibold text-center py-3 rounded-full" onClick={() => setOpen(false)}>
                Join Now
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
