import { NextRequest, NextResponse } from 'next/server'
import { PLANS } from '@/lib/razorpay'

export async function POST(req: NextRequest) {
  try {
    const { plan, email } = await req.json()

    const planConfig = PLANS[plan as keyof typeof PLANS]
    if (!planConfig) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Dynamically import razorpay — ensures it only runs server-side
    const Razorpay = (await import('razorpay')).default
    const razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    // Use Node built-in crypto (no import needed in Node 18+)
    const { randomBytes } = await import('crypto')
    const receipt = `rcpt_${randomBytes(6).toString('hex')}`

    const order = await razorpayInstance.orders.create({
      amount: planConfig.amount,
      currency: planConfig.currency,
      receipt,
      notes: { plan, email },
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
