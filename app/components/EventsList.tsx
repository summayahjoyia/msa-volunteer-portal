'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Pencil, ArrowUpDown } from 'lucide-react'
import MarkAttendanceButton from './MarkAttendanceButton'
import BulkMessageForm from './BulkMessageForm'
import DeleteEventButton from './DeleteEventButton'

type SortMode = 'date' | 'alpha'

export default function EventsList({ events }: { events: any[] }) {
  const [upcomingSort, setUpcomingSort] = useState<SortMode>('date')
  const [pastSort, setPastSort] = useState<SortMode>('date')
  const [pastSearch, setPastSearch] = useState('')

  const now = new Date()

  const upcomingEvents = useMemo(() => {
    const list = events.filter((e) => new Date(e.event_date) >= now)
    if (upcomingSort === 'alpha') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name))
    }
    return [...list].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
  }, [events, upcomingSort])

  const pastEvents = useMemo(() => {
    let list = events.filter((e) => new Date(e.event_date) < now)

    if (pastSearch.trim()) {
      const q = pastSearch.toLowerCase()
      list = list.filter(
        (e) => e.name?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q)
      )
    }

    if (pastSort === 'alpha') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name))
    }
    return [...list].sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
  }, [events, pastSearch, pastSort])

  function isEditable(eventDate: string) {
    const cutoff = new Date(eventDate)
    cutoff.setHours(cutoff.getHours() + 24)
    return new Date() < cutoff
  }

  function renderEventCard(event: any) {
    const editable = isEditable(event.event_date)
    return (
      <li key={event.id} className="bg-white dark:bg-[#2A2A2D] rounded-xl p-5 shadow-sm border-t-4 border-msa-gold transition-colors">
        <div className="flex justify-between items-start gap-3">
          <h2 className="text-lg font-semibold text-msa-green-dark dark:text-msa-cream">{event.name}</h2>
          <div className="flex gap-1 items-center shrink-0">
            {editable && (
              <Link
                href={`/admin/edit-event/${event.id}`}
                className="p-1.5 text-gray-400 hover:text-msa-green rounded-md hover:bg-msa-green/10 transition"
                aria-label="Edit event"
              >
                <Pencil size={16} />
              </Link>
            )}
            <DeleteEventButton eventId={event.id} seriesId={event.series_id} />
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {event.location}, {new Date(event.event_date).toLocaleString()}
        </p>
        <p className="text-sm mb-2 text-msa-green dark:text-[#3B9A72]">
          Sign-ups: {event.signups?.length || 0} / {event.v_capacity}
        </p>
        {event.signups && event.signups.length > 0 ? (
          <ul className="text-sm space-y-1 mt-2">
            {event.signups.map((s: any) => (
              <li key={s.id} className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-1">
                <div>
                  <div className="text-gray-900 dark:text-gray-100">{s.volunteers?.name}</div>
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

  const totalPastCount = events.filter((e) => new Date(e.event_date) < now).length

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Upcoming</h2>
        <button
          onClick={() => setUpcomingSort(upcomingSort === 'date' ? 'alpha' : 'date')}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-msa-green flex items-center gap-1.5"
        >
          <ArrowUpDown size={13} />
          {upcomingSort === 'date' ? 'Sort: Date' : 'Sort: A-Z'}
        </button>
      </div>

      {upcomingEvents.length > 0 ? (
        <ul className="space-y-6">{upcomingEvents.map(renderEventCard)}</ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 mb-6">No upcoming events.</p>
      )}

      {totalPastCount > 0 && (
        <details className="mt-10 group px-1 sm:px-0">
          <summary className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer select-none list-none flex items-center gap-1">
            <span className="transition-transform group-open:rotate-90">▸</span>
            Past events ({totalPastCount})
          </summary>

          <div className="flex items-center gap-3 mt-4 mb-4">
            <input
              placeholder="Search past events by name or location..."
              value={pastSearch}
              onChange={(e) => setPastSearch(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm flex-1 bg-white dark:bg-[#2A2A2D] dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
            <button
              onClick={() => setPastSort(pastSort === 'date' ? 'alpha' : 'date')}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-msa-green flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <ArrowUpDown size={13} />
              {pastSort === 'date' ? 'Sort: Date' : 'Sort: A-Z'}
            </button>
          </div>

          {pastEvents.length > 0 ? (
            <ul className="space-y-6 px-1 sm:px-0">{pastEvents.map(renderEventCard)}</ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No past events match your search.</p>
          )}
        </details>
      )}
    </>
  )
}