'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, useParams } from 'next/navigation'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import ThemeToggle from '../../../components/ThemeToggle'
import AdminNav from '../../../components/AdminNav'

const inputClass =
  'border rounded px-2 py-1 bg-white dark:bg-[#2A2A2D] dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500'
const labelClass = 'text-sm block mb-1 text-gray-700 dark:text-gray-300'

export default function EditEvent() {
  const params = useParams()
  const eventId = Number(params.id)
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [eventDay, setEventDay] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [capacity, setCapacity] = useState(5)

  const [calendarEventId, setCalendarEventId] = useState<string | null>(null)

  const [original, setOriginal] = useState({
    name: '',
    description: '',
    location: '',
    eventDay: '',
    startTime: '',
    endTime: '',
    capacity: 5,
  })

  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function fetchEvent() {
      const { data } = await supabase.from('events').select('*').eq('id', eventId).single()
      if (data) {
        const baseDate = data.event_end_date ? new Date(data.event_end_date) : new Date(data.event_date)
        const cutoff = new Date(baseDate)
        cutoff.setHours(cutoff.getHours() + 24)
        if (new Date() >= cutoff) {
          setLocked(true)
          setLoading(false)
          return
        }

        const startDateObj = new Date(data.event_date)
        const initialStartTime = startDateObj.toTimeString().slice(0, 5)
        const initialEndTime = data.event_end_date
          ? new Date(data.event_end_date).toTimeString().slice(0, 5)
          : ''

        const initial = {
          name: data.name,
          description: data.description || '',
          location: data.location || '',
          eventDay: startDateObj.toDateString(),
          startTime: initialStartTime,
          endTime: initialEndTime,
          capacity: data.v_capacity,
        }
        setName(initial.name)
        setDescription(initial.description)
        setLocation(initial.location)
        setEventDay(startDateObj)
        setStartTime(initial.startTime)
        setEndTime(initial.endTime)
        setCapacity(initial.capacity)
        setOriginal(initial)

        setCalendarEventId(data.google_calendar_event_id || null)
      }
      setLoading(false)
    }
    fetchEvent()
  }, [eventId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!eventDay) return

    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const newStartDateTime = new Date(eventDay)
    newStartDateTime.setHours(startHours, startMinutes)

    let newEndDateTime: Date | null = null
    if (endTime) {
      const [endHours, endMinutes] = endTime.split(':').map(Number)
      newEndDateTime = new Date(eventDay)
      newEndDateTime.setHours(endHours, endMinutes)

      if (newEndDateTime <= newStartDateTime) {
        setStatus('error')
        setErrorMessage('End time must be after the start time.')
        return
      }
    }

    setStatus('submitting')
    setErrorMessage('')

    const { error } = await supabase
      .from('events')
      .update({
        name,
        description,
        location,
        event_date: newStartDateTime.toISOString(),
        event_end_date: newEndDateTime ? newEndDateTime.toISOString() : null,
        v_capacity: capacity,
      })
      .eq('id', eventId)

    if (error) {
      setStatus('error')
      setErrorMessage('Something went wrong — try again.')
      return
    }


    if (calendarEventId) {
      const fallbackEnd = new Date(newStartDateTime.getTime() + 60 * 60 * 1000)
      try {
        await fetch('/api/calendar/update-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            calendarEventId,
            summary: name,
            description,
            location,
            startDateTime: newStartDateTime.toISOString(),
            endDateTime: (newEndDateTime || fallbackEnd).toISOString(),
          }),
        })
      } catch (err) {
        console.error('Calendar update sync failed:', err)
      }
    }

    router.push('/admin')
  }

  if (loading) return <p className="p-8">Loading...</p>

  if (locked) {
    return (
      <div className="min-h-screen bg-background transition-colors relative">
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
          <ThemeToggle />
        </div>
        <AdminNav />
        <main className="p-8 max-w-md mx-auto text-center">
          <p className="text-gray-500 dark:text-gray-400">
            This event has already happened and can no longer be edited.
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background transition-colors relative">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <ThemeToggle />
      </div>
      <AdminNav />
      <main className="p-8 max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-4 text-msa-green-dark dark:text-msa-cream">Edit Event</h1>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 bg-white dark:bg-[#2A2A2D] rounded-xl p-6 shadow-sm border-t-4 border-msa-gold transition-colors"
        >
          <div>
            <label className={labelClass}>Event name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={`${inputClass} w-full`}
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} w-full`}
              rows={3}
            />
          </div>

          <div>
            <label className={labelClass}>Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`${inputClass} w-full`}
            />
          </div>

          <div>
            <label className={labelClass}>Date</label>
            <div className="flex justify-center">
              <DayPicker
                mode="single"
                selected={eventDay}
                onSelect={setEventDay}
                disabled={{ before: new Date() }}
                style={
                  {
                    ['--rdp-outline' as any]: '2px solid #1F7A5C',
                    ['--rdp-outline-selected' as any]: '2px solid #1F7A5C',
                    ['--rdp-animation-duration' as any]: '0s',
                  } as React.CSSProperties
                }
                className="text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className={labelClass}>Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className={`${inputClass} w-full`}
              />
            </div>
            <div className="flex-1">
              <label className={labelClass}>End time (optional)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`${inputClass} w-full`}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Volunteers needed</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              required
              className={`${inputClass} w-full`}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'submitting' || !eventDay}
            className="bg-msa-green text-white rounded-lg px-3 py-1.5 hover:bg-msa-green-dark transition mt-2"
          >
            {status === 'submitting' ? 'Saving...' : 'Save Changes'}
          </button>
          {status === 'error' && <p className="text-red-500 text-sm">{errorMessage}</p>}
        </form>
      </main>
    </div>
  )
}