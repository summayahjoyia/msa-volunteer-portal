import { supabase } from '@/lib/supabase'
import AdminTabs from '../../components/AdminTabs'
import ThemeToggle from '../../components/ThemeToggle'
import AdminSignUpSections from '../../components/AdminSignUpSections'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminVolunteerSignup() {
  const { data: events, error } = await supabase
    .from('events')
    .select('*, signups(id, volunteer_id, role_id)')
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

  const eventsWithRoles = (events || []).map((event) => ({
    ...event,
    event_roles: rolesByEvent.get(event.id) || [],
  }))

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
        <AdminSignUpSections events={eventsWithRoles} />
      </main>
    </div>
  )
}