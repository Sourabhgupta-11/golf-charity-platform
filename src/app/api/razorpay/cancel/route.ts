import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // ✅ FIX: use getUser instead of getSession
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // ✅ Update subscription
    const { error } = await supabaseAdmin()
      .from('profiles')
      .update({
        subscription_status: 'cancelled',
        updated_at: now.toISOString(),
      })
      .eq('id', user.id)

    if (error) throw error

    // ✅ OPTIONAL: log event (recommended)
    await supabaseAdmin().from('subscription_events').insert({
      event_type: 'subscription.cancelled',
      payload: {
        user_id: user.id,
        cancelled_at: now.toISOString(),
      },
    })

    return NextResponse.json({ success: true })

  } catch (err: unknown) {
    console.error('Cancel error:', err)

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Cancel failed' },
      { status: 500 }
    )
  }
}