'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function CreateEvent() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [capacity, setCapacity] = useState(5)
  const [isRecurring, setIsRecurring] = useState(false)
  const [occurrences, setOccurrences] = useState(4)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')

    const baseDate = new Date(eventDate)
    const seriesId = isRecurring ? crypto.randomUUID() : null
    const count = isRecurring ? occurrences : 1

    const rows = Array.from({ length: count }).map((_, i) => {
      const date = new Date(baseDate)
      date.setDate(date.getDate() + i * 7)
      return {
        name,
        description,
        location,
        event_date: date.toISOString(),
        v_capacity: capacity,
        is_recurring: isRecurring,
        series_id: seriesId,
      }
    })

    const { error } = await supabase.from('events').insert(rows)

    if (error) {
      setStatus('error')
      return
    }

    setStatus('success')
    router.push('/admin')
  }

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Create Event</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input placeholder="Event name" value={name} onChange={(e) => setName(e.target.value)} required className="border rounded px-2 py-1" />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="border rounded px-2 py-1" />
        <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="border rounded px-2 py-1" />
        <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className="border rounded px-2 py-1" />
        <input type="number" placeholder="Volunteers needed" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required className="border rounded px-2 py-1" />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
          Repeat weekly
        </label>

        {isRecurring && (
          <input
            type="number"
            placeholder="Number of weeks"
            value={occurrences}
            onChange={(e) => setOccurrences(Number(e.target.value))}
            className="border rounded px-2 py-1"
          />
        )}

        <button type="submit" disabled={status === 'submitting'} className="bg-black text-white rounded px-3 py-1">
          {status === 'submitting' ? 'Creating...' : 'Create Event'}
        </button>
        {status === 'error' && <p className="text-red-500 text-sm">Something went wrong — try again.</p>}
      </form>
    </main>
  )
}