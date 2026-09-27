'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { formatEventTimeOnly } from '@/lib/formatEventTime'

type RoleData = {
  id: number
  role_name: string
  start_time: string | null
  end_time: string | null
  capacity: number
  google_calendar_event_id: string | null
  signups: { id: number; volunteer_id: number }[]
}

export default function EventRoleSignUp({
  eventId,
  eventName,
  location,
  groupChatLink,
  roles,
}: {
  eventId: number
  eventName: string
  location: string
  groupChatLink: string | null
  roles: RoleData[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [volunteer, setVolunteer] = useState<{ id: number; name: string; email: string } | null>(null)
  const [pendingRoleId, setPendingRoleId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadVolunteer() {
      if (authLoading) return
      if (!user?.email) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('volunteers')
        .select('id, name, email')
        .eq('email', user.email)
        .single()
      if (data) setVolunteer(data)
      setLoading(false)
    }
    loadVolunteer()
  }, [authLoading, user?.email])

  async function syncCalendarAttendee(
    action: 'add' | 'remove',
    calendarEventId: string | null,
    email: string
  ) {
    if (!calendarEventId) return
    try {
      await fetch(`/api/calendar/${action === 'add' ? 'add-attendee' : 'remove-attendee'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarEventId, email }),
      })
    } catch (err) {
      console.error('Calendar attendee sync failed:', err)
    }
  }

  async function handleSignUp(role: RoleData) {
    if (!volunteer) return
    setPendingRoleId(role.id)
    setErrorMessage('')

    const { count } = await supabase
      .from('signups')
      .select('id', { count: 'exact', head: true })
      .eq('role_id', role.id)

    if ((count || 0) >= role.capacity) {
      setErrorMessage(`Sorry, "${role.role_name}" just filled up.`)
      setPendingRoleId(null)
      router.refresh()
      return
    }

    const { error } = await supabase
      .from('signups')
      .insert({ event_id: eventId, volunteer_id: volunteer.id, role_id: role.id, status: 'confirmed' })

    if (error) {
      setErrorMessage(
        error.message?.includes('EVENT_FULL')
          ? `Sorry, "${role.role_name}" just filled up.`
          : 'Something went wrong — try again.'
      )
      setPendingRoleId(null)
      router.refresh()
      return
    }

    await fetch('/api/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: volunteer.email,
        name: volunteer.name,
        eventName,
        eventDate: role.start_time,
        location,
        groupChatLink,
        roleName: role.role_name,
      }),
    })

    await syncCalendarAttendee('add', role.google_calendar_event_id, volunteer.email)

    setPendingRoleId(null)
    router.refresh()
  }

  async function handleCancel(role: RoleData) {
    if (!volunteer) return
    const mySignup = role.signups.find((s) => s.volunteer_id === volunteer.id)
    if (!mySignup) return

    setPendingRoleId(role.id)

    const { error } = await supabase.from('signups').delete().eq('id', mySignup.id)

    if (!error) {
      await syncCalendarAttendee('remove', role.google_calendar_event_id, volunteer.email)
    }

    setPendingRoleId(null)
    router.refresh()
  }

  if (authLoading || loading) return null

  if (!user || !volunteer) {
    return <p className="mt-3 text-sm text-gray-500">Sign in to sign up for this event.</p>
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {roles.map((role) => {
        const mySignup = role.signups.find((s) => s.volunteer_id === volunteer.id)
        const isChecked = !!mySignup
        const spotsOpen = Math.max(role.capacity - role.signups.length, 0)
        const isFull = spotsOpen <= 0 && !isChecked
        const isPending = pendingRoleId === role.id

        return (
          <label
            key={role.id}
            className={`flex items-start gap-2.5 border rounded-lg px-3 py-2 text-sm transition ${
              isFull
                ? 'border-gray-100 dark:border-gray-800 opacity-60 cursor-not-allowed'
                : 'border-gray-200 dark:border-gray-700 cursor-pointer hover:border-msa-green'
            }`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              disabled={isPending || isFull}
              onChange={() => (isChecked ? handleCancel(role) : handleSignUp(role))}
              className="mt-0.5 accent-msa-green"
            />
            <div className="flex-1">
              <p className="text-gray-800 dark:text-gray-100 font-medium">{role.role_name}</p>
              {(role.start_time || role.end_time) && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {role.start_time && formatEventTimeOnly(role.start_time)}
                  {role.start_time && role.end_time && ' – '}
                  {role.end_time && formatEventTimeOnly(role.end_time)}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isFull ? 'Full' : `${spotsOpen} of ${role.capacity} spots open`}
              </p>
            </div>
          </label>
        )
      })}
      {errorMessage && <p className="text-red-500 text-xs">{errorMessage}</p>}
    </div>
  )
}