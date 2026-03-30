'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

function SuccessContent() {
  const searchParams = useSearchParams()
  const { refreshProfile } = useAuth()
  const subscribed = searchParams.get('subscribed') === 'true'

  useEffect(() => {
    if (subscribed) {
      // Refresh profile to pick up new subscription status
      const timer = setTimeout(refreshProfile, 2000)
      return () => clearTimeout(timer)
    }
  }, [subscribed, refreshProfile])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-lime/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
          <CheckCircle size={36} className="text-lime" />
        </div>

        <h1 className="text-4xl font-black mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          You&apos;re in!
        </h1>
        <p className="text-white/60 mb-2 text-lg">Welcome to Greenloop.</p>
        <p className="text-white/40 text-sm mb-10">
          Your subscription is active. Start logging scores to enter the next draw — and your chosen charity will receive their first contribution at your next billing date.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard"
            className="flex items-center justify-center gap-2 bg-lime text-ink font-bold px-8 py-4 rounded-full hover:bg-lime/90 transition-all">
            Go to Dashboard <ArrowRight size={16} />
          </Link>
          <Link href="/dashboard/scores"
            className="flex items-center justify-center gap-2 glass border border-white/10 text-white font-medium px-8 py-4 rounded-full hover:border-white/20 transition-all">
            Log First Score
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return <Suspense><SuccessContent /></Suspense>
}
