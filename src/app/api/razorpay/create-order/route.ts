import { NextRequest, NextResponse } from 'next/server'
import { PLANS } from '@/lib/razorpay'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json()

    const planConfig = PLANS[plan as keyof typeof PLANS]
    if (!planConfig) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }


const authHeader = req.headers.get('authorization');

if (!authHeader) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const token = authHeader.replace('Bearer ', '');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  }
);

const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}


    // Razorpay instance
    const Razorpay = (await import('razorpay')).default
    const razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const { randomBytes } = await import('crypto')
    const receipt = `rcpt_${randomBytes(6).toString('hex')}`

    const order = await razorpayInstance.orders.create({
      amount: planConfig.amount,
      currency: planConfig.currency,
      receipt,

      // ✅ FIXED notes
      notes: {
        user_id: user.id,
        plan,
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