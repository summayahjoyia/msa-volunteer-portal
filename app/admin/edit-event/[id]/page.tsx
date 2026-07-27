'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, useParams } from 'next/navigation'

export default function EditEvent() {
  const params = useParams()
  const eventId = Number(params.id)
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [capacity, setCapacity] = useState(5)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')

  useEffect(() => {
    async function fetchEvent() {
      const { data } = await supabase.from('events').select('*').eq('id', eventId).single()
      if (data) {
        setName(data.name)
        setDescription(data.description || '')
        setLocation(data.location || '')
        setEventDate(data.event_date?.slice(0, 16) || '')
        setCapacity(data.v_capacity)
      }
      setLoading(false)
    }
    fetchEvent()
  }, [eventId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')

    const { error } = await supabase
      .from('events')
      .update({
        name,
        description,
        location,
        event_date: new Date(eventDate).toISOString(),
        v_capacity: capacity,
      })
      .eq('id', eventId)

    if (error) {
      setStatus('error')
      return
    }

    const { data: signupsData } = await supabase
      .from('signups')
      .select('volunteers(email)')
      .eq('event_id', eventId)

    const emails = signupsData?.map((s: any) => s.volunteers?.email).filter(Boolean) || []

    if (emails.length > 0) {
      await fetch('/api/send-update-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails,
          eventName: name,
          eventDate: new Date(eventDate).toISOString(),
          location,
          description,
        }),
      })
    }

    router.push('/admin')
  }

  if (loading) return <p className="p-8">Loading...</p>

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Edit Event</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} required className="border rounded px-2 py-1" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="border rounded px-2 py-1" rows={3} />
        <input value={location} onChange={(e) => setLocation(e.target.value)} className="border rounded px-2 py-1" />
        <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className="border rounded px-2 py-1" />
        <input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required className="border rounded px-2 py-1" />
        <button type="submit" disabled={status === 'submitting'} className="bg-black text-white rounded px-3 py-1">
          {status === 'submitting' ? 'Saving...' : 'Save Changes'}
        </button>
        {status === 'error' && <p className="text-red-500 text-sm">Something went wrong — try again.</p>}
      </form>
    </main>
  )
}