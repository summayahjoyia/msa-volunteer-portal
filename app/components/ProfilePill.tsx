'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from './AuthProvider'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import GoogleSignInButton from './GoogleSignInButton'
import ComplaintModal from './ComplaintModal'

type Gender = 'sister' | 'brother'

function getInitials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return nameOrEmail.slice(0, 2).toUpperCase()
}

export default function ProfilePill() {
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [gender, setGender] = useState<Gender | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Look up the gender on load and again whenever the dropdown opens,
  // so a gender chosen in the first-time popup shows up without a reload.
  useEffect(() => {
    let cancelled = false

    async function loadGender() {
      if (!user?.email) {
        setGender(null)
        return
      }
      const { data } = await supabase
        .from('volunteers')
        .select('gender')
        .eq('email', user.email)
        .single()
      if (!cancelled) setGender((data?.gender as Gender | null) ?? null)
    }

    loadGender()
    return () => {
      cancelled = true
    }
  }, [user?.email, open])

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
    <>
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
          <div className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#2A2A2D] rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.name || user.email}
              </div>
              {gender && (
                <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-msa-green/10 text-msa-green-dark dark:bg-msa-gold/15 dark:text-msa-gold">
                  {gender === 'sister' ? 'Sister' : 'Brother'}
                </span>
              )}
            </div>
            <Link
              href="/my-events"
              className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#333336]"
              onClick={() => setOpen(false)}
            >
              My Events
            </Link>
            <button
              onClick={() => {
                setOpen(false)
                setFeedbackOpen(true)
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#333336]"
            >
              Feedback
            </button>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-gray-50 dark:hover:bg-[#333336]"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      <ComplaintModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  )
}