'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/auth/login" className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft size={14} />Back to login
        </Link>

        <div className="glass rounded-3xl p-8">
          {sent ? (
            <div className="text-center">
              <CheckCircle size={40} className="text-lime mx-auto mb-4" />
              <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'var(--font-display)' }}>Check your inbox</h2>
              <p className="text-white/50 text-sm">We sent a password reset link to <strong className="text-white">{email}</strong></p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-black mb-2" style={{ fontFamily: 'var(--font-display)' }}>Reset password</h1>
              <p className="text-white/40 text-sm mb-8">Enter your email and we&apos;ll send you a reset link</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                <Button type="submit" fullWidth loading={loading}>Send Reset Link</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
