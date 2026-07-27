import { supabase } from '@/lib/supabase'
import MarkAttendanceButton from '../components/MarkAttendanceButton'

export default async function AdminDashboard() {
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*, signups(id, status, volunteers(name, email))')
    .order('event_date', { ascending: true })

  if (eventsError) {
    return <div className="p-8 text-red-500">Error loading events: {eventsError.message}</div>
  }

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      {events && events.length > 0 ? (
        <ul className="space-y-6">
          {events.map((event) => (
            <li key={event.id} className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold">{event.name}</h2>
              <p className="text-sm text-gray-600 mb-2">
                {new Date(event.event_date).toLocaleString()} — {event.location}
              </p>
              <p className="text-sm mb-2">
                Sign-ups: {event.signups?.length || 0} / {event.v_capacity}
              </p>
              {event.signups && event.signups.length > 0 ? (
                <ul className="text-sm space-y-1 mt-2">
                  {event.signups.map((s: any) => (
                    <li key={s.id} className="flex justify-between items-center border-t pt-1">
                      <span>{s.volunteers?.name} ({s.volunteers?.email})</span>
                      <MarkAttendanceButton signupId={s.id} currentStatus={s.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No sign-ups yet.</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No events yet.</p>
      )}
    </main>
  )
}