'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from './AuthProvider'
import EventSignUpButton from './EventSignUpButton'
import EventRoleSignUp from './EventRoleSignUp'
import { formatEventDate, formatEventTime } from '@/lib/formatEventTime'
import { Calendar, MapPin } from 'lucide-react'

type RoleRow = {
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

type EventRow = {
  id: number
  name: string
  description: string | null
  location: string
  event_date: string
  event_end_date: string | null
  v_capacity: number
  brother_capacity: number | null
  sister_capacity: number | null
  google_calendar_event_id: string | null
  group_chat_link: string | null
  signups: { id: number; volunteer_id: number; role_id: number | null; gender: string | null }[]
  event_roles: RoleRow[]
}

export default function AdminSignUpSections({ events }: { events: EventRow[] }) {
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()
  const [myVolunteerId, setMyVolunteerId] = useState<number | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [cancelledSignupIds, setCancelledSignupIds] = useState<number[]>([])

  useEffect(() => {
    async function loadVolunteerId() {
      if (authLoading || !user?.email) return
      const { data } = await supabase
        .from('volunteers')
        .select('id')
        .eq('email', user.email)
        .single()
      if (data) setMyVolunteerId(data.id)
    }
    loadVolunteerId()
  }, [authLoading, user?.email])

  async function handleCancel(signupId: number, calendarEventId: string | null) {
    if (!user?.email) return
    setCancellingId(signupId)

    const { error } = await supabase.from('signups').delete().eq('id', signupId)

    if (!error) {
      if (calendarEventId) {
        try {
          await fetch('/api/calendar/remove-attendee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calendarEventId, email: user.email }),
          })
        } catch (err) {
          console.error('Calendar attendee sync failed:', err)
        }
      }
      setCancelledSignupIds((prev) => [...prev, signupId])
    }
    setCancellingId(null)
  }

  const mySignups = myVolunteerId
    ? events.flatMap((event) =>
        event.signups
          .filter((s) => s.volunteer_id === myVolunteerId && !cancelledSignupIds.includes(s.id))
          .map((s) => {
            const role = s.role_id ? event.event_roles.find((r) => r.id === s.role_id) : null
            return {
              event,
              signupId: s.id,
              roleName: role?.role_name || null,
              calendarEventId: role?.google_calendar_event_id || event.google_calendar_event_id,
            }
          })
      )
    : []

  return (
    <>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        My Sign-Ups
      </h2>
      {mySignups.length > 0 ? (
        <ul className="space-y-4 mb-8">
          {mySignups.map(({ event, signupId, roleName, calendarEventId }) => (
            <li
              key={signupId}
              className="bg-white dark:bg-[#2A2A2D] rounded-xl p-4 shadow-sm border-t-4 border-msa-gold transition-colors"
            >
              <h3 className="text-base font-semibold text-msa-green-dark dark:text-msa-cream">
                {event.name}
                {roleName && <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> — {roleName}</span>}
              </h3>
              <div className="mt-2 space-y-0.5 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-start gap-1.5">
                  <Calendar size={13} className="mt-0.5 shrink-0" />
                  <div>
                    <div>{formatEventDate(event.event_date)}</div>
                    <div>{formatEventTime(event.event_date, event.event_end_date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  <span>{event.location || 'Location TBD'}</span>
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                <button
                  onClick={() => handleCancel(signupId, calendarEventId)}
                  disabled={cancellingId === signupId}
                  className="border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs px-3 py-1.5 rounded-lg hover:border-red-300 hover:text-red-500 transition disabled:opacity-50"
                >
                  {cancellingId === signupId ? '...' : "Can't make it"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          You haven't signed up for any events yet.
        </p>
      )}

      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        All Events
      </h2>
      {events.length > 0 ? (
        <ul className="space-y-4">
          {events.map((event) => {
            const hasRoles = event.event_roles && event.event_roles.length > 0
            const activeNoRole = event.signups.filter(
              (s) => !cancelledSignupIds.includes(s.id) && s.role_id === null
            )
            const signedUpCount = activeNoRole.length
            const spotsOpen = Math.max(event.v_capacity - signedUpCount, 0)

            const isSplitEvent = event.brother_capacity != null || event.sister_capacity != null
            const brotherTaken = activeNoRole.filter((s) => s.gender === 'brother').length
            const sisterTaken = activeNoRole.filter((s) => s.gender === 'sister').length

            return (
              <li
                key={event.id}
                className="relative bg-white dark:bg-[#2A2A2D] rounded-xl p-4 shadow-sm border-t-4 border-msa-gold transition-colors"
              >
                <h3 className="text-base font-semibold text-msa-green-dark dark:text-msa-cream">{event.name}</h3>
                {event.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{event.description}</p>
                )}
                <div className="mt-2 space-y-0.5 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-start gap-1.5">
                    <Calendar size={13} className="mt-0.5 shrink-0" />
                    <div>
                      <div>{formatEventDate(event.event_date)}</div>
                      <div>{formatEventTime(event.event_date, event.event_end_date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} />
                    <span>{event.location || 'Location TBD'}</span>
                  </div>
                  {!hasRoles && !isSplitEvent && <p>Spots open: {spotsOpen} of {event.v_capacity}</p>}
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2 min-h-[100px]">
                  {hasRoles ? (
                    <EventRoleSignUp
                      eventId={event.id}
                      eventName={event.name}
                      location={event.location}
                      groupChatLink={event.group_chat_link}
                      roles={event.event_roles}
                    />
                  ) : (
                    <EventSignUpButton
                      eventId={event.id}
                      eventName={event.name}
                      eventDate={event.event_date}
                      location={event.location}
                      spotsOpen={spotsOpen}
                      brotherCapacity={event.brother_capacity}
                      sisterCapacity={event.sister_capacity}
                      brotherTaken={brotherTaken}
                      sisterTaken={sisterTaken}
                    />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No events yet.</p>
      )}
    </>
  )
}