import { supabase } from '@/lib/supabase'
import ExportButton from '../components/ExportButton'
import AdminTabs from '../components/AdminTabs'
import ThemeToggle from '../components/ThemeToggle'
import EventsList from '../components/EventsList'
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

  return (
    <div className="min-h-screen bg-background transition-colors relative">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <ThemeToggle />
      </div>

      <div className="pt-8 text-center">
        <p className="text-msa-gold text-base sm:text-lg tracking-wide mb-2" style={{ fontFamily: 'serif' }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <h1 className="text-2xl font-bold text-msa-green-dark dark:text-msa-cream">Admin Dashboard</h1>
      </div>

      <AdminTabs
        exportSlot={<ExportButton filename="events-signups.csv" rows={csvRows} label="Export" />}
      />

      <main className="p-8 max-w-3xl mx-auto">
        <EventsList events={events || []} />
      </main>
    </div>
  )
}