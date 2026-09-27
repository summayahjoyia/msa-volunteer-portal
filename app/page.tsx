import { supabase } from '@/lib/supabase'
import ProfilePill from './components/ProfilePill'
import EventSignUpButton from './components/EventSignUpButton'
import EventRoleSignUp from './components/EventRoleSignUp'
import ThemeToggle from './components/ThemeToggle'
import ShareEventButton from './components/ShareEventButton'
import { formatEventDate, formatEventTime } from '@/lib/formatEventTime'
import { Calendar, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  const { data: events, error } = await supabase
    .from('events')
    .select('*, signups(id)')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: false })

  if (error) {
    return <div className="p-8 text-red-500">Error loading events: {error.message}</div>
  }

  const eventIds = (events || []).map((e) => e.id)

  const { data: roles, error: rolesError } = eventIds.length
    ? await supabase
        .from('event_roles')
        .select('id, event_id, role_name, start_time, end_time, capacity, google_calendar_event_id, signups(id, volunteer_id)')
        .in('event_id', eventIds)
    : { data: [], error: null }

  if (rolesError) {
    return <div className="p-8 text-red-500">Error loading roles: {rolesError.message}</div>
  }

  const rolesByEvent = new Map<number, typeof roles>()
  for (const role of roles || []) {
    const list = rolesByEvent.get(role.event_id) || []
    list.push(role)
    rolesByEvent.set(role.event_id, list)
  }

  return (
    <main className="p-8 max-w-2xl mx-auto min-h-screen bg-background transition-colors">
      <div className="mb-6 flex items-center gap-3">
        <ThemeToggle />
        <div className="flex-1 flex justify-end">
          <ProfilePill />
        </div>
      </div>

      <div className="text-center mb-8">
        <p
          className="text-msa-gold text-base sm:text-lg tracking-wide mb-2"
          style={{ fontFamily: 'serif' }}
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <h1 className="text-2xl font-bold text-msa-green-dark dark:text-msa-cream">Upcoming Events</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Give a little time, earn a lasting reward</p>
      </div>

      {events && events.length > 0 ? (
        <ul className="space-y-3">
          {events.map((event) => {
            const signedUpCount = event.signups?.length || 0
            const spotsOpen = Math.max(event.v_capacity - signedUpCount, 0)
            const eventRoles = rolesByEvent.get(event.id) || []
            const hasRoles = eventRoles.length > 0
            return (
              <li
                key={event.id}
                className="bg-white dark:bg-[#2A2A2D] rounded-xl p-4 shadow-sm border-t-4 border-msa-gold transition-colors"
              >
                <div className="flex justify-between items-start gap-3">
                  <h2 className="text-base font-semibold text-msa-green-dark dark:text-msa-cream">{event.name}</h2>
                  <ShareEventButton eventId={event.id} />
                </div>
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
                  {!hasRoles && <p>Spots open: {spotsOpen} of {event.v_capacity}</p>}
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2 min-h-[100px]">
                  {hasRoles ? (
                    <EventRoleSignUp
                      eventId={event.id}
                      eventName={event.name}
                      location={event.location}
                      groupChatLink={event.group_chat_link}
              
                      roles={eventRoles}
                    />
                  ) : (
                    <EventSignUpButton
                      eventId={event.id}
                      eventName={event.name}
                      eventDate={event.event_date}
                      location={event.location}
                      spotsOpen={spotsOpen}
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
    </main>
  )
}