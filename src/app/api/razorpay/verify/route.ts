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
    } = await req.json()

    // ── Verify signature ──────────────────────────────────────────
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // ── Activate subscription in DB ───────────────────────────────
    const now = new Date()
    const endsAt = new Date(now)
    if (plan === 'yearly') {
      endsAt.setFullYear(endsAt.getFullYear() + 1)
    } else {
      endsAt.setMonth(endsAt.getMonth() + 1)
    }

    const db = supabaseAdmin()

    const { error } = await db
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_id: razorpay_payment_id,   // store payment ID as reference
        subscription_ends_at: endsAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('email', email)

    if (error) throw error

    // ── Log the payment event ─────────────────────────────────────
    await db.from('subscription_events').insert({
      razorpay_event_id: razorpay_payment_id,      // reuse column for payment ID
      event_type: 'razorpay.payment.captured',
      payload: {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        plan,
        email,
      },
    })

    // ── Record charity contribution ───────────────────────────────
    const { data: profile } = await db
      .from('profiles')
      .select('id, charity_id, charity_percentage, subscription_plan')
      .eq('email', email)
      .single()

    if (profile?.charity_id) {
      const monthlyFee = plan === 'yearly' ? 7499 / 12 : 829   // in ₹
      const amount = (profile.charity_percentage / 100) * monthlyFee

      await db.from('charity_contributions').insert({
        user_id: profile.id,
        charity_id: profile.charity_id,
        amount,
        contribution_month: now.toISOString().slice(0, 8) + '01',
        razorpay_payment_id: razorpay_payment_id,
      })

      // Increment charity total_raised
      await db.rpc('increment_charity_total', {
        charity_id: profile.charity_id,
        amount,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Payment verify error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 500 }
    )
  }
}
