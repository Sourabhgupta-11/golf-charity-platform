'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, Charity } from '@/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // Prevent duplicate fetches on rapid auth state changes
  const fetchingRef = useRef(false)

  const fetchProfile = useCallback(async (userId: string) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError.message)
        return
      }
      if (!profileData) return

      // Fetch charity separately — avoids FK join 500 errors
      let charityData: Charity | null = null
      if (profileData.charity_id) {
        const { data: cd } = await supabase
          .from('charities')
          .select('*')
          .eq('id', profileData.charity_id)
          .single()
        if (cd) charityData = cd as Charity
      }

      setProfile({ ...profileData, charity: charityData } as Profile)
    } catch (err) {
      console.error('Profile fetch unexpected error:', err)
    } finally {
      fetchingRef.current = false
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      fetchingRef.current = false // allow refresh to bypass the guard
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    // Get initial session once
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for sign-in / sign-out only — not token refresh events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only act on meaningful auth events, not silent token refreshes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            fetchingRef.current = false
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
          }
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
