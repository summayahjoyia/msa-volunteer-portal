'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import GoogleSignInButton from './GoogleSignInButton'

export default function UserStatusBar() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUser({
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
          email: data.user.email || '',
        })
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) return null

  if (!user) {
    return (
      <div className="w-full">
        <GoogleSignInButton redirectPath="/" />
      </div>
    )
  }

  return (
    <div className="w-full flex items-center justify-between gap-4 text-sm bg-white rounded-lg px-5 py-3 shadow-sm">
      <span className="text-gray-600 truncate">
        Signed in as{' '}
        <span className="font-semibold" style={{ color: '#0B3D2E' }}>
          {user.name || user.email}
        </span>
      </span>
      <button
        onClick={handleSignOut}
        className="text-gray-400 hover:text-red-600 transition shrink-0 whitespace-nowrap"
      >
        Sign out
      </button>
    </div>
  )
}