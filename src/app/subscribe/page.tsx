'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Check, Zap } from 'lucide-react'

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}
interface RazorpayOptions {
  key: string; amount: number; currency: string; name: string
  description: string; order_id: string
  handler: (r: RazorpayResponse) => void
  prefill: { name?: string; email?: string }
  theme: { color: string }
  modal: { ondismiss: () => void }
}
interface RazorpayInstance { open(): void }
interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

function SubscribeForm() {
  const searchParams = useSearchParams()
  const initialPlan = (searchParams.get('plan') as 'monthly' | 'yearly') || 'monthly'
  const [plan, setPlan] = useState<'monthly' | 'yearly'>(initialPlan)
  const [step, setStep] = useState<'account' | 'payment'>('account')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.full_name.trim()) e.full_name = 'Name is required'
    if (!form.email.includes('@')) e.email = 'Valid email required'
    if (form.password.length < 8) e.password = 'Must be at least 8 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name } },
      })
      if (signUpError) throw signUpError

      // Sign in immediately so session is available for create-order
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (loginError) throw loginError

      setStep('payment')
      toast.success('Account created! Now complete payment.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return }
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.onload = () => resolve(true)
      s.onerror = () => resolve(false)
      document.body.appendChild(s)
    })

  const handlePayment = async () => {
    setLoading(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Razorpay SDK failed to load. Check your internet connection.')

      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired. Please refresh and try again.')

      // Create order — pass plan only; route reads user from JWT
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      })
      const orderData = await res.json()
      if (orderData.error) throw new Error(orderData.error)

      const { orderId, amount, currency, keyId } = orderData

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'Greenloop',
        description: `${plan === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`,
        order_id: orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            // ── FIX: send plan + email + userId alongside Razorpay response ──
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan,             // ← was missing
                email: form.email, // ← was missing
                user_id: session.user.id, // ← extra safety for route
              }),
            })

            const result = await verifyRes.json()

            if (result.success) {
              toast.success('Payment successful! Welcome to Greenloop 🎉')
              router.replace('/dashboard?subscribed=true')
              router.refresh()
            } else {
              toast.error(result.error || 'Payment verification failed. Contact support.')
              setLoading(false)
            }
          } catch {
            toast.error('Verification request failed. Contact support.')
            setLoading(false)
          }
        },
        prefill: { name: form.full_name, email: form.email },
        theme: { color: '#C8FF00' },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled', { icon: '⚠️' })
            setLoading(false)
          },
        },
      })
      rzp.open()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Payment failed')
      setLoading(false)
    }
  }

  const prices = { monthly: '₹829', yearly: '₹7,499' }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-lime/4 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-lg">

        <Link href="/" className="flex items-center gap-2 justify-center mb-10">
          <div className="w-9 h-9 rounded-full bg-lime flex items-center justify-center">
            <span className="text-ink font-bold" style={{ fontFamily: 'var(--font-display)' }}>G</span>
          </div>
          <span className="text-white font-semibold text-xl" style={{ fontFamily: 'var(--font-display)' }}>Greenloop</span>
        </Link>

        {/* Progress */}
        <div className="flex items-center gap-3 justify-center mb-8">
          {(['account', 'payment'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? 'bg-lime text-ink' :
                step === 'payment' && s === 'account' ? 'bg-lime/30 text-lime' : 'glass text-white/40'
              }`}>
                {step === 'payment' && s === 'account' ? <Check size={14} /> : i + 1}
              </div>
              {i < 1 && <div className={`w-16 h-px ${step === 'payment' ? 'bg-lime/40' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <div className="glass rounded-3xl p-8 md:p-10">
          {step === 'account' ? (
            <>
              <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Create your account
              </h1>
              <p className="text-white/40 text-sm mb-8">Step 1 of 2 — Account details</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {(['monthly', 'yearly'] as const).map(p => (
                  <button key={p} onClick={() => setPlan(p)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      plan === p ? 'border-lime/50 bg-lime/10' : 'border-white/10 hover:border-white/20'
                    }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white capitalize">{p}</span>
                      {p === 'yearly' && <span className="text-xs text-lime flex items-center gap-1"><Zap size={10} />Save 25%</span>}
                    </div>
                    <span className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-mono)' }}>{prices[p]}</span>
                    <span className="text-white/40 text-xs ml-1">/{p === 'monthly' ? 'mo' : 'yr'}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <Input label="Full Name" placeholder="Arjun Sharma" value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} error={errors.full_name} required />
                <Input label="Email Address" type="email" placeholder="arjun@example.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} error={errors.email} required />
                <Input label="Password" type="password" placeholder="Min. 8 characters" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} error={errors.password} required />
                <Input label="Confirm Password" type="password" placeholder="Repeat password" value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} error={errors.confirm} required />
                <Button type="submit" fullWidth loading={loading} size="lg">Continue to Payment</Button>
              </form>
              <p className="text-center text-sm text-white/40 mt-6">
                Already subscribed?{' '}
                <Link href="/auth/login" className="text-lime hover:text-lime/80 transition-colors">Sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Complete payment
              </h1>
              <p className="text-white/40 text-sm mb-8">Step 2 of 2 — Secure checkout via Razorpay</p>

              <div className="glass rounded-2xl p-5 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-semibold capitalize">Greenloop {plan}</span>
                  <span className="text-lime font-bold font-mono">{prices[plan]}/{plan === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                <ul className="space-y-2">
                  {['Monthly prize draw entry', 'Score tracking dashboard', 'Charity contribution (min. 10%)', 'Cancel anytime'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/50">
                      <Check size={12} className="text-lime" />{f}
                    </li>
                  ))}
                </ul>
              </div>

              <Button onClick={handlePayment} fullWidth loading={loading} size="lg">
                Pay {prices[plan]} with Razorpay →
              </Button>

              <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                <span className="text-white/20 text-xs">Accepts</span>
                {['UPI', 'Cards', 'Netbanking', 'Wallets'].map(m => (
                  <span key={m} className="text-xs text-white/40 glass px-2 py-0.5 rounded-full">{m}</span>
                ))}
              </div>
              <p className="text-white/20 text-xs text-center mt-2">Secured by Razorpay · PCI-DSS compliant</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SubscribePage() {
  return <Suspense><SubscribeForm /></Suspense>
}