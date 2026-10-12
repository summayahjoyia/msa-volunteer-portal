import { supabase } from '@/lib/supabase'
import ExportButton from '../components/ExportButton'
import AdminTabs from '../components/AdminTabs'
import ThemeToggle from '../components/ThemeToggle'
import EventsList from '../components/EventsList'
export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*, signups(id, status, role_id, gender, volunteers(name, email))')
    .order('event_date', { ascending: true })

  if (eventsError) {
    return <div className="p-8 text-red-500">Error loading events: {eventsError.message}</div>
  }

  const eventIds = (events || []).map((e) => e.id)

  const { data: roles, error: rolesError } = eventIds.length
    ? await supabase
        .from('event_roles')
        .select('id, event_id, role_name, start_time, end_time, capacity, brother_capacity, sister_capacity')
        .in('event_id', eventIds)
    : { data: [], error: null }

  if (rolesError) {
    return <div className="p-8 text-red-500">Error loading roles: {rolesError.message}</div>
  }

  const roleNameById = new Map((roles || []).map((r) => [r.id, r.role_name]))

  const eventsWithRoles = (events || []).map((event) => {
    const eventRoles = (roles || [])
      .filter((r) => r.event_id === event.id)
      .map((r) => ({
        ...r,
        signups: (event.signups || []).filter((s: any) => s.role_id === r.id),
      }))

    const signupsWithRoleName = (event.signups || []).map((s: any) => ({
      ...s,
      role_name: s.role_id ? roleNameById.get(s.role_id) : null,
    }))

    return { ...event, event_roles: eventRoles, signups: signupsWithRoleName }
  })

  const csvRows = eventsWithRoles.flatMap((event) =>
    (event.signups?.length
      ? event.signups
      : [{ volunteers: null, status: 'no sign-ups', role_name: null, gender: null }]
    ).map((s: any) => ({
      event: event.name,
      date: new Date(event.event_date).toLocaleString(),
      location: event.location,
      role: s.role_name || '',
      gender: s.gender || '',
      volunteer_name: s.volunteers?.name || '',
      volunteer_email: s.volunteers?.email || '',
      status: s.status,
    }))
  )

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
        <EventsList events={eventsWithRoles} />
      </main>
    </div>
  )
}