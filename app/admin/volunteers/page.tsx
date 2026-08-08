'use client'

import { useState, useEffect, Fragment } from 'react'
import { createClient } from '@/lib/supabase-browser'
import AdminTabs from '../../components/AdminTabs'
import ThemeToggle from '../../components/ThemeToggle'
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
    <div className="min-h-screen bg-background transition-colors relative">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <ThemeToggle />
      </div>

      <div className="pt-8 text-center">
        <p className="text-msa-gold text-base sm:text-lg tracking-wide mb-2" style={{ fontFamily: 'serif' }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <h1 className="text-2xl font-bold text-msa-green-dark dark:text-msa-cream">Volunteer History</h1>
      </div>

      <AdminTabs />

      <main className="p-8 max-w-3xl mx-auto">
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-full mb-4 bg-white dark:bg-[#2A2A2D] dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
        />

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400 text-center">Loading...</p>
        ) : filtered.length > 0 ? (
          <div className="bg-white dark:bg-[#2A2A2D] rounded-xl border-t-4 border-msa-gold overflow-hidden shadow-sm transition-colors">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-msa-cream dark:bg-[#3A3A3D]">
                  <th className="text-left px-4 py-2.5 font-semibold" style={{ color: '#0B3D2E' }}>Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold hidden sm:table-cell" style={{ color: '#0B3D2E' }}>Email</th>
                  <th className="text-center px-4 py-2.5 font-semibold" style={{ color: '#0B3D2E' }}>Events</th>
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
                        className="border-t border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#333336]"
                      >
                        <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{v.name}</td>
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{v.email}</td>
                        <td className="px-4 py-2.5 text-center text-msa-green dark:text-[#3B9A72] font-medium">{attendedCount}</td>
                        <td className="px-4 py-2.5 text-gray-400">
                          <ChevronRight
                            size={16}
                            className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
                          />
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-gray-50/60 dark:bg-[#242426]">
                          <td colSpan={4} className="px-4 py-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden mb-2">{v.email}</p>
                            {v.signups && v.signups.length > 0 ? (
                              <ul className="space-y-1.5">
                                {v.signups.map((s, i) => (
                                  <li key={i} className="flex justify-between items-center text-sm text-gray-700 dark:text-gray-300">
                                    <span>{s.events?.name}</span>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-md ${
                                        s.status === 'attended'
                                          ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
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
          <p className="text-gray-500 dark:text-gray-400 text-center">No volunteers found.</p>
        )}
      </main>
    </div>
  )
}