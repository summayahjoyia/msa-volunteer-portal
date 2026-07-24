import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })

  if (error) {
    return <div className="p-8 text-red-500">Error loading events: {error.message}</div>
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upcoming Events</h1>
      {events && events.length > 0 ? (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold">{event.name}</h2>
              {event.description && <p className="text-sm text-gray-600">{event.description}</p>}
              <p className="text-sm mt-2">
                📍 {event.location || 'TBD'} — {new Date(event.event_date).toLocaleString()}
              </p>
              <p className="text-sm">Spots needed: {event.v_capacity}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No events yet.</p>
      )}
    </main>
  )
}