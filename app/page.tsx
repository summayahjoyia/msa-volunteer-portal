import { supabase } from '@/lib/supabase'
import ProfilePill from './components/ProfilePill'
import EventSignUpButton from './components/EventSignUpButton'
import ThemeToggle from './components/ThemeToggle'
import { format } from 'date-fns'
import { Calendar, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  const { data: events, error } = await supabase
    .from('events')
    .select('*, signups(id)')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })

  if (error) {
    return <div className="p-8 text-red-500">Error loading events: {error.message}</div>
  }

  return (
    <main className="p-8 max-w-2xl mx-auto min-h-screen bg-background transition-colors">
      <div className="mb-6 flex items-center gap-3">
        <ThemeToggle />
        <ProfilePill />
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
        <ul className="space-y-4">
          {events.map((event) => {
            const signedUpCount = event.signups?.length || 0
            const spotsOpen = Math.max(event.v_capacity - signedUpCount, 0)
            return (
              <li
                key={event.id}
                className="bg-white dark:bg-[#2A2A2D] rounded-xl p-5 shadow-sm border-t-4 border-msa-gold transition-colors"
              >
                <h2 className="text-lg font-semibold text-msa-green-dark dark:text-msa-cream">{event.name}</h2>
                {event.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
                )}

                <div className="mt-3 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>{format(new Date(event.event_date), "EEEE, MMM d 'at' h:mm a")}</span>
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
  )
}