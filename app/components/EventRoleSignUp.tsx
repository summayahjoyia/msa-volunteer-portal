'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { formatEventTimeOnly } from '@/lib/formatEventTime'
import GroupCounts from './GroupCounts'

type Gender = 'sister' | 'brother'

type RoleData = {
  id: number
  role_name: string
  start_time: string | null
  end_time: string | null
  capacity: number
  brother_capacity: number | null
  sister_capacity: number | null
  google_calendar_event_id: string | null
  signups: { id: number; volunteer_id: number; gender: string | null }[]
}

const isSplit = (r: RoleData) => r.brother_capacity != null || r.sister_capacity != null

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
  const [volunteer, setVolunteer] = useState<{
    id: number
    name: string
    email: string
    gender: Gender | null
  } | null>(null)
  const [pendingRoleId, setPendingRoleId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [optimisticChecked, setOptimisticChecked] = useState<Record<number, boolean>>({})

  useEffect(() => {
    async function loadVolunteer() {
      if (authLoading) return
      if (!user?.email) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('volunteers')
        .select('id, name, email, gender')
        .eq('email', user.email)
        .single()
      if (data) setVolunteer(data)
      setLoading(false)
    }
    loadVolunteer()
  }, [authLoading, user?.email])

  useEffect(() => {
    setOptimisticChecked({})
  }, [roles])

  function syncCalendarAttendee(action: 'add' | 'remove', calendarEventId: string | null, email: string) {
    if (!calendarEventId) return
    fetch(`/api/calendar/${action === 'add' ? 'add-attendee' : 'remove-attendee'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendarEventId, email }),
    }).catch((err) => console.error('Calendar attendee sync failed:', err))
  }

  async function handleSignUp(role: RoleData) {
    if (!volunteer) return
    const split = isSplit(role)
    // In a split role we need to know which group they belong to
    if (split && !volunteer.gender) return

    setOptimisticChecked((prev) => ({ ...prev, [role.id]: true }))
    setPendingRoleId(role.id)
    setErrorMessage('')

    let countQuery = supabase
      .from('signups')
      .select('id', { count: 'exact', head: true })
      .eq('role_id', role.id)
    if (split) countQuery = countQuery.eq('gender', volunteer.gender)
    const { count } = await countQuery

    const limit = split
      ? volunteer.gender === 'brother'
        ? role.brother_capacity ?? 0
        : role.sister_capacity ?? 0
      : role.capacity

    if ((count || 0) >= limit) {
      setOptimisticChecked((prev) => ({ ...prev, [role.id]: false }))
      setErrorMessage(`Sorry, "${role.role_name}" just filled up.`)
      setPendingRoleId(null)
      router.refresh()
      return
    }

    const { error } = await supabase
      .from('signups')
      .insert({ event_id: eventId, volunteer_id: volunteer.id, role_id: role.id, status: 'confirmed' })

    if (error) {
      setOptimisticChecked((prev) => ({ ...prev, [role.id]: false }))
      setErrorMessage(
        error.message?.includes('EVENT_FULL')
          ? `Sorry, "${role.role_name}" just filled up.`
          : 'Something went wrong — try again.'
      )
      setPendingRoleId(null)
      router.refresh()
      return
    }

    fetch('/api/send-confirmation', {
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
    }).catch((err) => console.error('Confirmation email failed:', err))

    syncCalendarAttendee('add', role.google_calendar_event_id, volunteer.email)

    setPendingRoleId(null)
    router.refresh()
  }

  async function handleCancel(role: RoleData) {
    if (!volunteer) return
    const mySignup = role.signups.find((s) => s.volunteer_id === volunteer.id)
    if (!mySignup) return

    setOptimisticChecked((prev) => ({ ...prev, [role.id]: false }))
    setPendingRoleId(role.id)

    const { error } = await supabase.from('signups').delete().eq('id', mySignup.id)

    if (error) {
      setOptimisticChecked((prev) => ({ ...prev, [role.id]: true }))
      setPendingRoleId(null)
      return
    }

    syncCalendarAttendee('remove', role.google_calendar_event_id, volunteer.email)

    setPendingRoleId(null)
    router.refresh()
  }

  if (authLoading || loading) return null

  if (!user || !volunteer) {
    return <p className="mt-3 text-sm text-gray-500">Sign in to sign up for this event.</p>
  }

  const viewerGender = volunteer.gender

  // If every role is closed to the viewer's group, dim the whole card
  const closedToViewer =
    !!viewerGender &&
    roles.length > 0 &&
    roles.every(
      (r) =>
        isSplit(r) &&
        (viewerGender === 'brother' ? (r.brother_capacity ?? 0) : (r.sister_capacity ?? 0)) === 0
    )

  return (
    <div className="mt-3 flex flex-col gap-2">
      {closedToViewer && (
        <div className="absolute inset-0 rounded-xl bg-gray-200/60 dark:bg-black/40 pointer-events-none" />
      )}
      {roles.map((role) => {
        const split = isSplit(role)
        const brothers = {
          cap: role.brother_capacity ?? 0,
          taken: role.signups.filter((s) => s.gender === 'brother').length,
        }
        const sisters = {
          cap: role.sister_capacity ?? 0,
          taken: role.signups.filter((s) => s.gender === 'sister').length,
        }
        const myGroup = viewerGender === 'brother' ? brothers : viewerGender === 'sister' ? sisters : null

        const sharedOpen = Math.max(role.capacity - role.signups.length, 0)
        const openForMe = split ? (myGroup ? Math.max(myGroup.cap - myGroup.taken, 0) : 0) : sharedOpen

        const serverChecked = role.signups.some((s) => s.volunteer_id === volunteer.id)
        const isChecked = role.id in optimisticChecked ? optimisticChecked[role.id] : serverChecked
        // Closed or full for this volunteer's group: just disabled, no extra label
        const isDisabled = !isChecked && openForMe <= 0
        const isPending = pendingRoleId === role.id

        return (
          <label
            key={role.id}
            className={`flex items-start gap-2.5 border rounded-lg px-3 py-2 text-sm transition ${
              isDisabled
                ? 'border-gray-100 dark:border-gray-800 opacity-60 cursor-not-allowed'
                : 'border-gray-200 dark:border-gray-700 cursor-pointer hover:border-msa-green'
            }`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              disabled={isPending || isDisabled}
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
              {split ? (
                <div className="mt-0.5">
                  <GroupCounts brothers={brothers} sisters={sisters} viewerGender={viewerGender} />
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isDisabled ? 'Full' : `${sharedOpen} of ${role.capacity} spots open`}
                </p>
              )}
            </div>
          </label>
        )
      })}
      {errorMessage && <p className="text-red-500 text-xs">{errorMessage}</p>}
    </div>
  )
}