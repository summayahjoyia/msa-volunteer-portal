'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from '../components/AuthProvider'
import ThemeToggle from '../components/ThemeToggle'
import ProfilePill from '../components/ProfilePill'
import Link from 'next/link'
import { ChevronLeft, Calendar, MapPin } from 'lucide-react'
import { format } from 'date-fns'

type SignupRow = {
  status: string
  events: { id: number; name: string; location: string; event_date: string } | null
}

export default function MyEvents() {
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<SignupRow[]>([])

  useEffect(() => {
    async function load() {
      if (authLoading) return
      if (!user?.email) {
        setLoading(false)
        return
      }

      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('id')
        .eq('email', user.email)
        .single()

      if (volunteer) {
        const { data } = await supabase
          .from('signups')
          .select('status, events(id, name, location, event_date)')
          .eq('volunteer_id', volunteer.id)
        setRows((data as any) || [])
      }
      setLoading(false)
    }
    load()
  }, [authLoading, user?.email])

  const now = new Date()
  const upcoming = rows
    .filter((r) => r.events && new Date(r.events.event_date) >= now)
    .sort((a, b) => new Date(a.events!.event_date).getTime() - new Date(b.events!.event_date).getTime())
  const past = rows
    .filter((r) => r.events && new Date(r.events.event_date) < now)
    .sort((a, b) => new Date(b.events!.event_date).getTime() - new Date(a.events!.event_date).getTime())

  const attendedCount = rows.filter((r) => r.status === 'attended').length

  return (
    <main className="p-8 max-w-2xl mx-auto min-h-screen bg-background transition-colors">
      <div className="mb-6 flex items-center gap-3">
        <ThemeToggle />
        <div className="flex-1 flex justify-end">
          <ProfilePill />
        </div>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-msa-green-dark dark:hover:text-msa-cream transition mb-6"
      >
        <ChevronLeft size={16} />
        Back to Events
      </Link>

      <div className="text-center mb-8">
        <p className="text-msa-gold text-base sm:text-lg tracking-wide mb-2" style={{ fontFamily: 'serif' }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <h1 className="text-2xl font-bold text-msa-green-dark dark:text-msa-cream">My Events</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {attendedCount > 0
            ? `You've attended ${attendedCount} event${attendedCount > 1 ? 's' : ''} — JazakAllah Khair!`
            : 'Your sign-up history will appear here'}
        </p>
      </div>

      {authLoading || loading ? (
        <p className="text-gray-500 dark:text-gray-400 text-center">Loading...</p>
      ) : (
        <>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Upcoming
          </h2>
          {upcoming.length > 0 ? (
            <ul className="space-y-3 mb-8">
              {upcoming.map((r, i) => (
                <li
                  key={i}
                  className="bg-white dark:bg-[#2A2A2D] rounded-xl p-4 shadow-sm border-t-4 border-msa-gold"
                >
                  <h3 className="font-semibold text-msa-green-dark dark:text-msa-cream">{r.events?.name}</h3>
                  <div className="mt-1.5 space-y-0.5 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>{format(new Date(r.events!.event_date), "EEEE, MMM d 'at' h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      <span>{r.events?.location || 'Location TBD'}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">No upcoming sign-ups.</p>
          )}

          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Past
          </h2>
          {past.length > 0 ? (
            <ul className="space-y-3">
              {past.map((r, i) => (
                <li
                  key={i}
                  className="bg-white dark:bg-[#2A2A2D] rounded-xl p-4 shadow-sm border-t-4 border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">{r.events?.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md shrink-0 ${
                        r.status === 'attended'
                          ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : r.status === 'absent'
                          ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>{format(new Date(r.events!.event_date), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      <span>{r.events?.location || 'Location TBD'}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No past events yet.</p>
          )}
        </>
      )}
    </main>
  )
}