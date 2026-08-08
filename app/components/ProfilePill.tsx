'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import GoogleSignInButton from './GoogleSignInButton'

function getInitials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return nameOrEmail.slice(0, 2).toUpperCase()
}

export default function ProfilePill() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) return null

  if (!user) {
    return <GoogleSignInButton redirectPath="/" />
  }

  const initials = getInitials(user.name || user.email)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-white dark:bg-[#2A2A2D] rounded-full pl-1.5 pr-2.5 py-1.5 shadow-sm transition"
      >
        <div className="w-6 h-6 rounded-full bg-msa-gold flex items-center justify-center text-xs font-bold" style={{ color: '#0B3D2E' }}>
          {initials}
        </div>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-[#2A2A2D] rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50">
          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 truncate">
            {user.name || user.email}
          </div>
          <Link
            href="/my-events"
            className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#333336]"
            onClick={() => setOpen(false)}
          >
            My Events
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-gray-50 dark:hover:bg-[#333336]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}