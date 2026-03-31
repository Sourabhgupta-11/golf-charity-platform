'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // Fetch profile to determine role for redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      toast.success('Welcome back!')

      // Role-based redirect
      if (profile?.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-lime/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 justify-center mb-10">
          <div className="w-9 h-9 rounded-full bg-lime flex items-center justify-center">
            <span className="text-ink font-bold" style={{ fontFamily: 'var(--font-display)' }}>G</span>
          </div>
          <span className="text-white font-semibold text-xl" style={{ fontFamily: 'var(--font-display)' }}>
            Greenloop
          </span>
        </Link>

        <div className="glass rounded-3xl p-8 md:p-10">
          <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Welcome back
          </h1>
          <p className="text-white/40 text-sm mb-8">Sign in to your Greenloop account</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-xs text-white/40 hover:text-lime transition-colors">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" fullWidth loading={loading} size="lg">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            No account?{' '}
            <Link href="/subscribe" className="text-lime hover:text-lime/80 transition-colors">
              Subscribe to get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
