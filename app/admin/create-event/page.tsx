'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { DayPicker } from 'react-day-picker'
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns'
import 'react-day-picker/dist/style.css'
import AdminNav from '../../components/AdminNav'
import ThemeToggle from '../../components/ThemeToggle'
import { Plus, X } from 'lucide-react'

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'annually' | 'custom'

type RoleInput = {
  id: string
  name: string
  startTime: string
  endTime: string
  capacity: number
}

const PRESET_LOCATIONS = [
  'Hub Prayer Room',
  "SUB (Students' Union Building)",
  'CAB (Central Academic Building)',
  'Myer Horowitz Theatre',
  'Quad',
  'Other (custom)',
]

const inputClass =
  'border rounded px-2 py-1 bg-white dark:bg-[#2A2A2D] dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 min-w-0'

export default function CreateEvent() {
  const [name, setName] = useState('')
  const [task, setTask] = useState('')
  const [whatToBring, setWhatToBring] = useState('')
  const [notes, setNotes] = useState('')
  const [locationChoice, setLocationChoice] = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [groupChatLink, setGroupChatLink] = useState('')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState('14:00')
  const [endTime, setEndTime] = useState('')
  const [capacity, setCapacity] = useState(5)
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none')
  const [occurrences, setOccurrences] = useState(4)
  const [customInterval, setCustomInterval] = useState(3)
  const [roles, setRoles] = useState<RoleInput[]>([])
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const location = locationChoice === 'Other (custom)' ? customLocation : locationChoice

  const description = [
    task,
    whatToBring ? `What to bring: ${whatToBring}.` : '',
    notes,
  ].filter(Boolean).join(' ')

  const isToday = startDate ? startDate.toDateString() === new Date().toDateString() : false
  const minTime = isToday ? new Date().toTimeString().slice(0, 5) : undefined

  const generatedDates = useMemo(() => {
    if (!startDate) return []
    if (recurrence === 'none') return [startDate]

    const dates: Date[] = []
    for (let i = 0; i < occurrences; i++) {
      let d = startDate
      switch (recurrence) {
        case 'daily': d = addDays(startDate, i); break
        case 'weekly': d = addWeeks(startDate, i); break
        case 'biweekly': d = addWeeks(startDate, i * 2); break
        case 'monthly': d = addMonths(startDate, i); break
        case 'annually': d = addYears(startDate, i); break
        case 'custom': d = addDays(startDate, i * customInterval); break
      }
      dates.push(d)
    }
    return dates
  }, [startDate, recurrence, occurrences, customInterval])

  function addRole() {
    setRoles((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', startTime: '', endTime: '', capacity: 1 },
    ])
  }

  function updateRole(id: string, field: keyof RoleInput, value: string | number) {
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  function removeRole(id: string) {
    setRoles((prev) => prev.filter((r) => r.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate) return

    const [hours, minutes] = time.split(':').map(Number)
    const firstEventDateTime = new Date(startDate)
    firstEventDateTime.setHours(hours, minutes)

    if (firstEventDateTime < new Date()) {
      setStatus('error')
      setErrorMessage("That time has already passed today — please pick a time later than now.")
      return
    }

    if (endTime) {
      const [endHours, endMinutes] = endTime.split(':').map(Number)
      const endMinutesTotal = endHours * 60 + endMinutes
      const startMinutesTotal = hours * 60 + minutes
      if (endMinutesTotal <= startMinutesTotal) {
        setStatus('error')
        setErrorMessage('End time must be after the start time.')
        return
      }
    }

    for (const role of roles) {
      if (!role.name.trim()) {
        setStatus('error')
        setErrorMessage('Every role needs a name.')
        return
      }
      if (!role.capacity || role.capacity < 1) {
        setStatus('error')
        setErrorMessage(`"${role.name}" needs a capacity of at least 1.`)
        return
      }
    }

    setStatus('submitting')
    setErrorMessage('')

    const seriesId = recurrence !== 'none' ? crypto.randomUUID() : null

    const rows = generatedDates.map((d) => {
      const eventDateTime = new Date(d)
      eventDateTime.setHours(hours, minutes)

      let eventEndDateTime: string | null = null
      if (endTime) {
        const [endHours, endMinutes] = endTime.split(':').map(Number)
        const endDateTime = new Date(d)
        endDateTime.setHours(endHours, endMinutes)
        eventEndDateTime = endDateTime.toISOString()
      }

      return {
        name,
        description,
        location,
        event_date: eventDateTime.toISOString(),
        event_end_date: eventEndDateTime,
        v_capacity: capacity,
        is_recurring: recurrence !== 'none',
        series_id: seriesId,
        group_chat_link: groupChatLink || null,
      }
    })

    const { data: insertedEvents, error } = await supabase
      .from('events')
      .insert(rows)
      .select('id, name, description, location, event_date, event_end_date')

    if (error) {
      setStatus('error')
      setErrorMessage('Something went wrong — try again.')
      return
    }

    if (roles.length > 0 && insertedEvents) {
      for (const ev of insertedEvents) {
        const eventDay = new Date(ev.event_date)

        const roleRows = roles.map((role) => {
          let roleStart: string | null = null
          let roleEnd: string | null = null

          if (role.startTime) {
            const [h, m] = role.startTime.split(':').map(Number)
            const d = new Date(eventDay)
            d.setHours(h, m)
            roleStart = d.toISOString()
          } else {
            roleStart = ev.event_date
          }

          if (role.endTime) {
            const [h, m] = role.endTime.split(':').map(Number)
            const d = new Date(eventDay)
            d.setHours(h, m)
            roleEnd = d.toISOString()
          } else {
            roleEnd = ev.event_end_date
          }

          return {
            event_id: ev.id,
            role_name: role.name,
            start_time: roleStart,
            end_time: roleEnd,
            capacity: role.capacity,
          }
        })

        const { data: insertedRoles } = await supabase
          .from('event_roles')
          .insert(roleRows)
          .select('id, role_name, start_time, end_time')

        for (const insertedRole of insertedRoles || []) {
          try {
            const res = await fetch('/api/calendar/create-event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                summary: `${ev.name} — ${insertedRole.role_name}`,
                description: ev.description,
                location: ev.location,
                startDateTime: insertedRole.start_time,
                endDateTime: insertedRole.end_time || insertedRole.start_time,
                attendeeEmails: [],
              }),
            })
            const result = await res.json()
            if (result.calendarEventId) {
              await supabase
                .from('event_roles')
                .update({ google_calendar_event_id: result.calendarEventId })
                .eq('id', insertedRole.id)
            }
          } catch (err) {
            console.error('Role calendar sync failed:', err)
          }
        }
      }
    }

    for (const ev of insertedEvents || []) {
      try {
        const res = await fetch('/api/calendar/create-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: ev.name,
            description: ev.description,
            location: ev.location,
            startDateTime: ev.event_date,
            endDateTime:
              ev.event_end_date ||
              new Date(new Date(ev.event_date).getTime() + 60 * 60 * 1000).toISOString(),
            attendeeEmails: [],
          }),
        })
        const result = await res.json()
        if (result.calendarEventId) {
          await supabase
            .from('events')
            .update({ google_calendar_event_id: result.calendarEventId })
            .eq('id', ev.id)
        }
      } catch (calendarError) {
        console.error('Calendar sync failed:', calendarError)
      }
    }

    setStatus('success')
    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-background transition-colors relative">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <ThemeToggle />
      </div>

      <AdminNav />
      <main className="p-4 sm:p-8 max-w-2xl mx-auto overflow-x-hidden">
        <div className="mb-6 text-center">
          <p className="text-msa-gold text-base sm:text-lg tracking-wide mb-2" style={{ fontFamily: 'serif' }}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <h1 className="text-2xl font-bold text-msa-green-dark dark:text-msa-cream">Create Event</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white dark:bg-[#2A2A2D] rounded-xl p-4 sm:p-6 shadow-sm border-t-4 border-msa-gold transition-colors min-w-0">
          <input
            placeholder="Event name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={`${inputClass} w-full`}
          />

          <div className="flex flex-col gap-2 min-w-0">
            <label className="text-sm block text-gray-700 dark:text-gray-300">Description</label>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 block">What will volunteers be doing?</label>
              <textarea
                placeholder="e.g. Help set up chairs and prayer mats before Jummah"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                required
                className={`${inputClass} w-full text-sm`}
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 block">What should they bring? (optional)</label>
              <input
                placeholder="e.g. comfortable clothing"
                value={whatToBring}
                onChange={(e) => setWhatToBring(e.target.value)}
                className={`${inputClass} w-full text-sm`}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 block">Anything else volunteers should know? (optional)</label>
              <textarea
                placeholder="e.g. Please arrive 15 minutes early"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${inputClass} w-full text-sm`}
                rows={2}
              />
            </div>
            {description && <p className="text-sm text-gray-500 dark:text-gray-400 italic break-words">Preview: {description}</p>}
          </div>

          <div className="min-w-0">
            <label className="text-sm block mb-1 text-gray-700 dark:text-gray-300">Location</label>
            <select
              value={locationChoice}
              onChange={(e) => setLocationChoice(e.target.value)}
              required
              className={`${inputClass} w-full`}
            >
              <option value="" disabled>Select a location</option>
              {PRESET_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            {locationChoice === 'Other (custom)' && (
              <input
                placeholder="Enter custom location"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                required
                className={`${inputClass} w-full mt-2`}
              />
            )}
          </div>

          <div className="min-w-0">
            <label className="text-sm block mb-1 text-gray-700 dark:text-gray-300">
              Group chat link (sent to volunteers who sign up)
            </label>
            <input
              placeholder="e.g. WhatsApp group invite link"
              value={groupChatLink}
              onChange={(e) => setGroupChatLink(e.target.value)}
              className={`${inputClass} w-full`}
            />
          </div>

          <div className="min-w-0">
            <label className="text-sm block mb-1 text-gray-700 dark:text-gray-300">Start date</label>
            <div className="flex justify-center overflow-x-auto">
              <DayPicker
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={{ before: new Date() }}
                modifiers={{ recurring: generatedDates }}
                modifiersStyles={{
                  recurring: { backgroundColor: '#1F7A5C', color: 'white' },
                }}
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

          <div className="flex flex-col sm:flex-row gap-3 min-w-0">
            <div className="flex-1 min-w-0">
              <label className="text-sm block mb-1 text-gray-700 dark:text-gray-300">Start time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                min={minTime}
                required
                className={`${inputClass} w-full`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-sm block mb-1 text-gray-700 dark:text-gray-300">End time (optional)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                min={time || undefined}
                className={`${inputClass} w-full`}
              />
            </div>
          </div>

          <div className="min-w-0">
            <label className="text-sm block mb-1 text-gray-700 dark:text-gray-300">
              Volunteers needed {roles.length > 0 && '(only used if no roles are added below)'}
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              required
              className={`${inputClass} w-full`}
            />
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 min-w-0">
            <div className="flex items-center justify-between mb-2 gap-2">
              <label className="text-sm block text-gray-700 dark:text-gray-300">
                Roles (optional — lets volunteers pick a specific task instead of a general sign-up)
              </label>
              <button
                type="button"
                onClick={addRole}
                className="text-sm text-msa-green font-medium flex items-center gap-1.5 shrink-0"
              >
                <Plus size={15} />
                Add a role
              </button>
            </div>

            {roles.length > 0 && (
              <div className="flex flex-col gap-3 mt-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col gap-2 min-w-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        placeholder="Role name (e.g. Set-up)"
                        value={role.name}
                        onChange={(e) => updateRole(role.id, 'name', e.target.value)}
                        className={`${inputClass} flex-1 min-w-0`}
                      />
                      <button
                        type="button"
                        onClick={() => removeRole(role.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-600/10 transition shrink-0"
                        aria-label="Remove role"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                      <div className="flex-1 min-w-0">
                        <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                          Start time (defaults: event start)
                        </label>
                        <input
                          type="time"
                          value={role.startTime}
                          onChange={(e) => updateRole(role.id, 'startTime', e.target.value)}
                          className={`${inputClass} w-full`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                          End time (default: event end)
                        </label>
                        <input
                          type="time"
                          value={role.endTime}
                          onChange={(e) => updateRole(role.id, 'endTime', e.target.value)}
                          className={`${inputClass} w-full`}
                        />
                      </div>
                      <div className="w-full sm:w-24 min-w-0">
                        <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                          Capacity
                        </label>
                        <input
                          type="number"
                          value={role.capacity}
                          onChange={(e) => updateRole(role.id, 'capacity', Number(e.target.value))}
                          min={1}
                          className={`${inputClass} w-full`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <label className="text-sm block mb-1 text-gray-700 dark:text-gray-300">Repeats</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
              className={`${inputClass} w-full`}
            >
              <option value="none">Doesn't repeat</option>
              <option value="daily">Daily</option>
              <option value="biweekly">Biweekly</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="annually">Annually</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {recurrence === 'custom' && (
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              Every
              <input
                type="number"
                value={customInterval}
                onChange={(e) => setCustomInterval(Number(e.target.value))}
                className={`${inputClass} w-16`}
              />
              days
            </div>
          )}

          {recurrence !== 'none' && (
            <div className="min-w-0">
              <label className="text-sm block mb-1 text-gray-700 dark:text-gray-300">Number of occurrences</label>
              <input
                type="number"
                value={occurrences}
                onChange={(e) => setOccurrences(Number(e.target.value))}
                className={`${inputClass} w-full`}
              />
            </div>
          )}

          {generatedDates.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
              This will create {generatedDates.length} event{generatedDates.length > 1 ? 's' : ''} on:{' '}
              {generatedDates.map((d) => format(d, 'MMM d')).join(', ')}
              {roles.length > 0 && `, each with ${roles.length} role${roles.length > 1 ? 's' : ''}`}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'submitting' || !startDate}
            className="bg-msa-green text-white rounded-lg px-3 py-1.5 hover:bg-msa-green-dark transition"
          >
            {status === 'submitting' ? 'Creating...' : 'Create Event'}
          </button>
          {status === 'error' && <p className="text-red-500 text-sm">{errorMessage}</p>}
        </form>
      </main>
    </div>
  )
}