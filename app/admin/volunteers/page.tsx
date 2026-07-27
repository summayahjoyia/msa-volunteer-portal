import { supabase } from '@/lib/supabase'

export default async function VolunteerHistory() {
  const { data: volunteers, error } = await supabase
    .from('volunteers')
    .select('*, signups(status, events(name, event_date))')
    .order('name', { ascending: true })

  if (error) {
    return <div className="p-8 text-red-500">Error loading volunteers: {error.message}</div>
  }

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Volunteer History</h1>
      {volunteers && volunteers.length > 0 ? (
        <ul className="space-y-6">
          {volunteers.map((v) => (
            <li key={v.id} className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold">{v.name}</h2>
              <p className="text-sm text-gray-600 mb-2">{v.email}</p>
              <p className="text-sm mb-2">
                Events attended: {v.signups?.filter((s: any) => s.status === 'attended').length || 0}
              </p>
              {v.signups && v.signups.length > 0 ? (
                <ul className="text-sm space-y-1 mt-2">
                  {v.signups.map((s: any, i: number) => (
                    <li key={i} className="flex justify-between border-t pt-1">
                      <span>{s.events?.name}</span>
                      <span className="text-gray-500">{s.status}</span>
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
        <p className="text-gray-500">No volunteers yet.</p>
      )}
    </main>
  )
}