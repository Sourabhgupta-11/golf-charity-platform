import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const db = supabaseAdmin()

    // Delete all user data in correct order (respect FK constraints)
    // 1. Delete draw entries
    await db.from('draw_entries').delete().eq('user_id', userId)

    // 2. Delete winners records
    await db.from('winners').delete().eq('user_id', userId)

    // 3. Delete golf scores (trigger handles this on profile delete, but be explicit)
    await db.from('golf_scores').delete().eq('user_id', userId)

    // 4. Delete charity contributions
    await db.from('charity_contributions').delete().eq('user_id', userId)

    // 5. Delete subscription events
    await db.from('subscription_events').delete().eq('user_id', userId)

    // 6. Delete profile (ON DELETE CASCADE handles golf_scores, but we already cleaned up)
    await db.from('profiles').delete().eq('id', userId)

    // 7. Delete from auth.users — this is the final step, invalidates all sessions
    const { error: authDeleteError } = await db.auth.admin.deleteUser(userId)
    if (authDeleteError) {
      console.error('Auth user delete error:', authDeleteError)
      // Profile is already deleted — log but don't fail the response
      // The user is effectively gone from the app
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Delete account error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Account deletion failed' },
      { status: 500 }
    )
  }
}
