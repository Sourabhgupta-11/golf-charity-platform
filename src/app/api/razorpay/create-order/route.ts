import { NextRequest, NextResponse } from 'next/server'
import { razorpay, PLANS } from '@/lib/razorpay'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { plan, email } = await req.json()

    const planConfig = PLANS[plan as keyof typeof PLANS]
    if (!planConfig) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Create a short receipt ID
    const receipt = `rcpt_${crypto.randomBytes(6).toString('hex')}`

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: planConfig.amount,
      currency: planConfig.currency,
      receipt,
      notes: {
        plan,
        email,
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
    })
  } catch (err: unknown) {
    console.error('Razorpay order error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Order creation failed' },
      { status: 500 }
    )
  }
}
