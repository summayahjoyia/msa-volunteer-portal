'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

type AuthUser = {
  id: string
  name: string
  email: string
} | null

const AuthContext = createContext<{ user: AuthUser; loading: boolean }>({
  user: null,
  loading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    async function loadUser() {
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      if (data?.user) {
        setUser({
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
          email: data.user.email || '',
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
          email: session.user.email || '',
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}