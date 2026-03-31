import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      email,
      user_id, // extra field sent by subscribe page as a safety fallback
    } = await req.json()

    // ── 1. Validate required fields ──────────────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing Razorpay payment fields' },
        { status: 400 }
      )
    }
    if (!plan) {
      return NextResponse.json({ error: 'Missing plan' }, { status: 400 })
    }
    if (!email && !user_id) {
      return NextResponse.json(
        { error: 'Missing user identifier (email or user_id)' },
        { status: 400 }
      )
    }

    // ── 2. Verify Razorpay signature ─────────────────────────────
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.error('Razorpay signature mismatch')
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const db = supabaseAdmin()

    // ── 3. Find profile — prefer user_id (faster), fallback to email ──
    let profileId: string | null = null
    let charityId: string | null = null
    let charityPercentage = 10

    if (user_id) {
      const { data: profile, error } = await db
        .from('profiles')
        .select('id, charity_id, charity_percentage')
        .eq('id', user_id)
        .single()

      if (!error && profile) {
        profileId = profile.id
        charityId = profile.charity_id ?? null
        charityPercentage = profile.charity_percentage ?? 10
      }
    }

    // Fallback to email lookup
    if (!profileId && email) {
      const { data: profile, error } = await db
        .from('profiles')
        .select('id, charity_id, charity_percentage')
        .eq('email', email)
        .single()

      if (!error && profile) {
        profileId = profile.id
        charityId = profile.charity_id ?? null
        charityPercentage = profile.charity_percentage ?? 10
      }
    }

    if (!profileId) {
      console.error('Profile not found. email:', email, 'user_id:', user_id)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // ── 4. Calculate subscription end date ────────────────────────
    const now = new Date()
    const endsAt = new Date(now)
    if (plan === 'yearly') {
      endsAt.setFullYear(endsAt.getFullYear() + 1)
    } else {
      endsAt.setMonth(endsAt.getMonth() + 1)
    }

    // ── 5. Activate subscription ──────────────────────────────────
    const { error: updateError } = await db
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_id: razorpay_payment_id,
        subscription_ends_at: endsAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', profileId)

    if (updateError) {
      console.error('Subscription update failed:', updateError)
      return NextResponse.json(
        { error: 'Failed to activate subscription' },
        { status: 500 }
      )
    }

    // ── 6. Log payment event — best effort ────────────────────────
    try {
      await db.from('subscription_events').insert({
        user_id: profileId,
        razorpay_event_id: razorpay_payment_id,
        event_type: 'razorpay.payment.captured',
        payload: {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          plan,
          email,
        },
      })
    } catch (e) {
      console.warn('Event log failed (non-fatal):', e)
    }

    // ── 7. Charity contribution — best effort ─────────────────────
    try {
      if (charityId) {
        const monthlyFee = plan === 'yearly' ? 7499 / 12 : 829
        const amount =
          Math.round(((charityPercentage || 10) / 100) * monthlyFee * 100) / 100

        await db.from('charity_contributions').insert({
          user_id: profileId,
          charity_id: charityId,
          amount,
          contribution_month: now.toISOString().slice(0, 8) + '01',
          razorpay_payment_id: razorpay_payment_id,
        })

        await db.rpc('increment_charity_total', {
          p_charity_id: charityId,
          p_amount: amount,
        })
      }
    } catch (e) {
      console.warn('Charity contribution failed (non-fatal):', e)
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Verify route error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 500 }
    )
  }
}