import { supabase } from '@/lib/supabase'
import UserStatusBar from './components/UserStatusBar'
import EventSignUpButton from './components/EventSignUpButton'

export default async function Home() {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })

  if (error) {
    return <div className="p-8 text-red-500">Error loading events: {error.message}</div>
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="relative mb-8 text-center">
        <UserStatusBar />
        <p className="text-msa-gold text-sm tracking-wide mb-1">بِسْمِ اللَّهِ</p>
        <h1 className="text-2xl font-bold text-msa-green-dark">Upcoming Events</h1>
        <p className="text-sm text-gray-500 mt-1">Give a little time, earn a lasting reward</p>
      </div>

      {events && events.length > 0 ? (
        <ul className="space-y-4">
          {events.map((event) => (
            <li
              key={event.id}
              className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-msa-gold"
            >
              <h2 className="text-lg font-semibold text-msa-green-dark">{event.name}</h2>
              {event.description && <p className="text-sm text-gray-600 mt-1">{event.description}</p>}
              <p className="text-sm mt-3 text-msa-green">
                {event.location || 'TBD'}, {new Date(event.event_date).toLocaleString()}
              </p>
              <p className="text-sm text-msa-green">Spots needed: {event.v_capacity}</p>
              <EventSignUpButton
                eventId={event.id}
                eventName={event.name}
                eventDate={event.event_date}
                location={event.location}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No events yet.</p>
      )}
    </main>
  )
}