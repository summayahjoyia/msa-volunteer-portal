import { supabase } from '@/lib/supabase'
import MarkAttendanceButton from '../components/MarkAttendanceButton'
import BulkMessageForm from '../components/BulkMessageForm'
import DeleteEventButton from '../components/DeleteEventButton'
import ExportButton from '../components/ExportButton'
import AdminTabs from '../components/AdminTabs'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*, signups(id, status, volunteers(name, email))')
    .order('event_date', { ascending: true })

  if (eventsError) {
    return <div className="p-8 text-red-500">Error loading events: {eventsError.message}</div>
  }

  const csvRows = events?.flatMap((event) =>
    (event.signups?.length
      ? event.signups
      : [{ volunteers: null, status: 'no sign-ups' }]
    ).map((s: any) => ({
      event: event.name,
      date: new Date(event.event_date).toLocaleString(),
      location: event.location,
      volunteer_name: s.volunteers?.name || '',
      volunteer_email: s.volunteers?.email || '',
      status: s.status,
    }))
  ) || []

  const now = new Date()
  const upcomingEvents = events?.filter((e) => new Date(e.event_date) >= now) || []
  const pastEvents = (events?.filter((e) => new Date(e.event_date) < now) || []).sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  )

  function renderEventCard(event: any) {
    return (
      <li key={event.id} className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-msa-gold">
        <div className="flex justify-between items-start gap-3">
          <h2 className="text-lg font-semibold text-msa-green-dark">{event.name}</h2>
          <div className="flex gap-1 items-center shrink-0">
            <Link
              href={`/admin/edit-event/${event.id}`}
              className="p-1.5 text-gray-400 hover:text-msa-green rounded-md hover:bg-msa-green/10 transition"
              aria-label="Edit event"
            >
              <Pencil size={16} />
            </Link>
            <DeleteEventButton eventId={event.id} seriesId={event.series_id} />
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          {event.location}, {new Date(event.event_date).toLocaleString()}
        </p>
        <p className="text-sm mb-2 text-msa-green">
          Sign-ups: {event.signups?.length || 0} / {event.v_capacity}
        </p>
        {event.signups && event.signups.length > 0 ? (
          <ul className="text-sm space-y-1 mt-2">
            {event.signups.map((s: any) => (
              <li key={s.id} className="flex justify-between items-center border-t border-gray-100 pt-1">
                <div>
                  <div className="text-gray-900">{s.volunteers?.name}</div>
                  <div className="text-xs text-gray-400">{s.volunteers?.email}</div>
                </div>
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
    )
  }

  return (
    <>
      <div className="pt-8 text-center">
        <p className="text-msa-gold text-base sm:text-lg tracking-wide mb-2" style={{ fontFamily: 'serif' }}>
  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
</p>
        <h1 className="text-2xl font-bold text-msa-green-dark">Admin Dashboard</h1>
      </div>

      <AdminTabs
        exportSlot={<ExportButton filename="events-signups.csv" rows={csvRows} label="Export" />}
      />

      <main className="p-8 max-w-3xl mx-auto">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Upcoming</h2>
        {upcomingEvents.length > 0 ? (
          <ul className="space-y-6">{upcomingEvents.map(renderEventCard)}</ul>
        ) : (
          <p className="text-gray-500 mb-6">No upcoming events.</p>
        )}

        {pastEvents.length > 0 && (
          <details className="mt-10 group">
            <summary className="text-sm font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none list-none flex items-center gap-1">
              <span className="transition-transform group-open:rotate-90">▸</span>
              Past events ({pastEvents.length})
            </summary>
            <ul className="space-y-6 mt-4">{pastEvents.map(renderEventCard)}</ul>
          </details>
        )}
      </main>
    </>
  )
}