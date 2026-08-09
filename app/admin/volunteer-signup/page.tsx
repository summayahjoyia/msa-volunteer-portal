import { supabase } from '@/lib/supabase'
import EventSignUpButton from '../../components/EventSignUpButton'
import AdminTabs from '../../components/AdminTabs'
import ThemeToggle from '../../components/ThemeToggle'
import ShareEventButton from '../../components/ShareEventButton'
import { format } from 'date-fns'
import { Calendar, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function formatEventTime(start: string, end: string | null) {
  const startStr = format(new Date(start), "EEEE, MMM d 'at' h:mm a")
  if (!end) return startStr
  const endStr = format(new Date(end), 'h:mm a')
  return `${startStr} – ${endStr}`
}

export default async function AdminVolunteerSignup() {
  const { data: events, error } = await supabase
    .from('events')
    .select('*, signups(id)')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: false })

  if (error) {
    return <div className="p-8 text-red-500">Error loading events: {error.message}</div>
  }

  return (
    <div className="min-h-screen bg-background transition-colors relative">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <ThemeToggle />
      </div>

      <div className="pt-8 text-center">
        <p className="text-msa-gold text-base sm:text-lg tracking-wide mb-2" style={{ fontFamily: 'serif' }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <h1 className="text-2xl font-bold text-msa-green-dark dark:text-msa-cream">Sign Up to Volunteer</h1>
      </div>

      <AdminTabs />

      <main className="p-8 max-w-2xl mx-auto">
        {events && events.length > 0 ? (
          <ul className="space-y-4">
            {events.map((event) => {
              const signedUpCount = event.signups?.length || 0
              const spotsOpen = Math.max(event.v_capacity - signedUpCount, 0)
              return (
                <li
                  key={event.id}
                  className="bg-white dark:bg-[#2A2A2D] rounded-xl p-5 shadow-sm border-t-4 border-msa-gold transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <h2 className="text-lg font-semibold text-msa-green-dark dark:text-msa-cream">{event.name}</h2>
                    <ShareEventButton eventId={event.id} />
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
                  )}

                  <div className="mt-3 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>{formatEventTime(event.event_date, event.event_end_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      <span>{event.location || 'Location TBD'}</span>
                    </div>
                    <p>Spots open: {spotsOpen} of {event.v_capacity}</p>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700 mt-3 pt-3">
                    <EventSignUpButton
                      eventId={event.id}
                      eventName={event.name}
                      eventDate={event.event_date}
                      location={event.location}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No events yet.</p>
        )}
      </main>
    </div>
  )
}