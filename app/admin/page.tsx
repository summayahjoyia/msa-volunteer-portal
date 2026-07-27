import { supabase } from '@/lib/supabase'
import MarkAttendanceButton from '../components/MarkAttendanceButton'
import BulkMessageForm from '../components/BulkMessageForm'
import DeleteEventButton from '../components/DeleteEventButton'
import Link from 'next/link'

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
      <div className="mb-4 flex gap-4">
        <Link href="/admin/volunteers" className="text-sm underline">View Volunteer History →</Link>
        <Link href="/admin/create-event" className="text-sm underline">+ Create Event</Link>
      </div>
      {events && events.length > 0 ? (
        <ul className="space-y-6">
          {events.map((event) => (
            <li key={event.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-semibold">{event.name}</h2>
                <div className="flex gap-2 items-center">
                  <Link href={`/admin/edit-event/${event.id}`} className="text-sm underline">Edit</Link>
                  <DeleteEventButton eventId={event.id} seriesId={event.series_id} />
                </div>
              </div>
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
              <BulkMessageForm
                emails={event.signups?.map((s: any) => s.volunteers?.email).filter(Boolean) || []}
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