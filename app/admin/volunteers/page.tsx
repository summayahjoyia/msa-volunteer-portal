'use client'

import { useState, useEffect, Fragment } from 'react'
import { createClient } from '@/lib/supabase-browser'
import AdminTabs from '../../components/AdminTabs'
import { ChevronRight } from 'lucide-react'

type Volunteer = {
  id: number
  name: string
  email: string
  signups: { status: string; events: { name: string; event_date: string } | null }[]
}

export default function VolunteerHistory() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchVolunteers() {
      const { data } = await supabase
        .from('volunteers')
        .select('id, name, email, signups(status, events(name, event_date))')
        .order('name', { ascending: true })
      setVolunteers((data as any) || [])
      setLoading(false)
    }
    fetchVolunteers()
  }, [])

  const filtered = volunteers.filter(
    (v) =>
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="pt-8 text-center">
        <p className="text-msa-gold text-sm tracking-wide mb-1">بِسْمِ اللَّهِ</p>
        <h1 className="text-2xl font-bold text-msa-green-dark">Volunteer History</h1>
      </div>

      <AdminTabs />

      <main className="p-8 max-w-3xl mx-auto">
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-full mb-4"
        />

        {loading ? (
          <p className="text-gray-500 text-center">Loading...</p>
        ) : filtered.length > 0 ? (
          <div className="bg-white rounded-xl border-t-4 border-msa-gold overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-msa-cream">
                  <th className="text-left px-4 py-2.5 font-semibold text-msa-green-dark">Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-msa-green-dark hidden sm:table-cell">Email</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-msa-green-dark">Events</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const attendedCount = v.signups?.filter((s) => s.status === 'attended').length || 0
                  const isOpen = expandedId === v.id
                  return (
                    <Fragment key={v.id}>
                      <tr
                        onClick={() => setExpandedId(isOpen ? null : v.id)}
                        className="border-t border-gray-100 cursor-pointer hover:bg-gray-50"
                      >
                        <td className="px-4 py-2.5 text-gray-900">{v.name}</td>
                        <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">{v.email}</td>
                        <td className="px-4 py-2.5 text-center text-msa-green font-medium">{attendedCount}</td>
                        <td className="px-4 py-2.5 text-gray-400">
                          <ChevronRight
                            size={16}
                            className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
                          />
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={4} className="px-4 py-3">
                            <p className="text-xs text-gray-500 sm:hidden mb-2">{v.email}</p>
                            {v.signups && v.signups.length > 0 ? (
                              <ul className="space-y-1.5">
                                {v.signups.map((s, i) => (
                                  <li key={i} className="flex justify-between items-center text-sm">
                                    <span>{s.events?.name}</span>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-md ${
                                        s.status === 'attended'
                                          ? 'bg-green-50 text-green-700'
                                          : 'bg-gray-100 text-gray-500'
                                      }`}
                                    >
                                      {s.status}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-400">No sign-ups yet.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center">No volunteers found.</p>
        )}
      </main>
    </>
  )
}