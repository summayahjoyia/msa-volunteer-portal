'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, useParams } from 'next/navigation'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import ThemeToggle from '../../../components/ThemeToggle'
import AdminNav from '../../../components/AdminNav'
import { Plus, X } from 'lucide-react'

type Audience = 'everyone' | 'both' | 'brothers' | 'sisters'

type AudienceValues = {
  audience: Audience
  capacity: number
  brotherCapacity: number
  sisterCapacity: number
}

type SignedUp = { total: number; brothers: number; sisters: number }

type RoleState = AudienceValues & {
  key: string
  dbId: number | null
  isNew: boolean
  name: string
  startTime: string
  endTime: string
  googleCalendarEventId: string | null
  signedUp: SignedUp
}

const baseInput =
  'border rounded px-2 bg-white dark:bg-[#2A2A2D] dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 min-w-0'
// Single-line inputs and selects get a fixed height so they all line up
const inputClass = `${baseInput} h-9`
// Textareas size from their rows instead
const textareaClass = `${baseInput} py-1.5`
const labelClass = 'text-sm block mb-1 text-gray-700 dark:text-gray-300'

// Turns the form's audience choice into the values we store.
// total goes in the original single-capacity column so older displays stay sensible.
function toCapacities(a: AudienceValues): { total: number; brother: number | null; sister: number | null } {
  switch (a.audience) {
    case 'both':
      return { total: a.brotherCapacity + a.sisterCapacity, brother: a.brotherCapacity, sister: a.sisterCapacity }
    case 'brothers':
      return { total: a.capacity, brother: a.capacity, sister: 0 }
    case 'sisters':
      return { total: a.capacity, brother: 0, sister: a.capacity }
    default:
      return { total: a.capacity, brother: null, sister: null }
  }
}

// Reads stored capacities back into the form's audience choice
function toAudienceValues(
  capacity: number,
  brother: number | null,
  sister: number | null,
  defaults: { brother: number; sister: number }
): AudienceValues {
  if (brother == null && sister == null) {
    return { audience: 'everyone', capacity, brotherCapacity: defaults.brother, sisterCapacity: defaults.sister }
  }
  const b = brother ?? 0
  const s = sister ?? 0
  if (b > 0 && s === 0) {
    return { audience: 'brothers', capacity: b, brotherCapacity: b, sisterCapacity: defaults.sister }
  }
  if (s > 0 && b === 0) {
    return { audience: 'sisters', capacity: s, brotherCapacity: defaults.brother, sisterCapacity: s }
  }
  return { audience: 'both', capacity: b + s, brotherCapacity: b, sisterCapacity: s }
}

function validateCapacity(label: string, a: AudienceValues): string | null {
  if (a.audience === 'both') {
    if (a.brotherCapacity < 0 || a.sisterCapacity < 0) return `${label}: spots can't be negative.`
    if (a.brotherCapacity + a.sisterCapacity < 1) return `${label} needs at least 1 spot.`
  } else if (!a.capacity || a.capacity < 1) {
    return `${label} needs at least 1 spot.`
  }
  return null
}

function countSignedUp(rows: { gender: string | null }[]): SignedUp {
  return {
    total: rows.length,
    brothers: rows.filter((r) => r.gender === 'brother').length,
    sisters: rows.filter((r) => r.gender === 'sister').length,
  }
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function AudienceFields({
  values,
  onChange,
  singleLabel,
  labelClass,
  signedUp,
}: {
  values: AudienceValues
  onChange: (patch: Partial<AudienceValues>) => void
  singleLabel: string
  labelClass: string
  signedUp?: SignedUp
}) {
  const singleText =
    values.audience === 'brothers'
      ? 'Brothers needed'
      : values.audience === 'sisters'
      ? 'Sisters needed'
      : singleLabel

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="min-w-0">
        <label className={labelClass}>Who can sign up</label>
        <select
          value={values.audience}
          onChange={(e) => onChange({ audience: e.target.value as Audience })}
          className={`${inputClass} w-full`}
        >
          <option value="everyone">Anyone (one shared limit)</option>
          <option value="both">Brothers and sisters (separate limits)</option>
          <option value="brothers">Brothers only</option>
          <option value="sisters">Sisters only</option>
        </select>
      </div>

      {values.audience === 'both' ? (
        <div className="flex gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <label className={labelClass}>Brothers needed</label>
            <input
              type="number"
              min={0}
              value={values.brotherCapacity}
              onChange={(e) => onChange({ brotherCapacity: Number(e.target.value) })}
              className={`${inputClass} w-full`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className={labelClass}>Sisters needed</label>
            <input
              type="number"
              min={0}
              value={values.sisterCapacity}
              onChange={(e) => onChange({ sisterCapacity: Number(e.target.value) })}
              className={`${inputClass} w-full`}
            />
          </div>
        </div>
      ) : (
        <div className="min-w-0 sm:max-w-[10rem]">
          <label className={labelClass}>{singleText}</label>
          <input
            type="number"
            min={1}
            value={values.capacity}
            onChange={(e) => onChange({ capacity: Number(e.target.value) })}
            className={`${inputClass} w-full`}
          />
        </div>
      )}

      {signedUp && signedUp.total > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Signed up so far: {signedUp.total}
          {(signedUp.brothers > 0 || signedUp.sisters > 0) &&
            ` (${plural(signedUp.brothers, 'brother')}, ${plural(signedUp.sisters, 'sister')})`}
          . Lowering a limit never removes anyone.
        </p>
      )}
    </div>
  )
}

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
  const [groupChatLink, setGroupChatLink] = useState('')
  const [eventDay, setEventDay] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [main, setMain] = useState<AudienceValues>({
    audience: 'everyone',
    capacity: 5,
    brotherCapacity: 3,
    sisterCapacity: 3,
  })
  const [mainSignedUp, setMainSignedUp] = useState<SignedUp>({ total: 0, brothers: 0, sisters: 0 })
  const [roles, setRoles] = useState<RoleState[]>([])
  const [removedRoleIds, setRemovedRoleIds] = useState<number[]>([])

  const [calendarEventId, setCalendarEventId] = useState<string | null>(null)

  const [original, setOriginal] = useState({
    name: '',
    description: '',
    location: '',
    eventDay: '',
    startTime: '',
    endTime: '',
    caps: '',
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

        const mainValues = toAudienceValues(data.v_capacity, data.brother_capacity, data.sister_capacity, {
          brother: 3,
          sister: 3,
        })

        setName(data.name)
        setDescription(data.description || '')
        setLocation(data.location || '')
        setGroupChatLink(data.group_chat_link || '')
        setEventDay(startDateObj)
        setStartTime(initialStartTime)
        setEndTime(initialEndTime)
        setMain(mainValues)
        setCalendarEventId(data.google_calendar_event_id || null)
        setOriginal({
          name: data.name,
          description: data.description || '',
          location: data.location || '',
          eventDay: startDateObj.toDateString(),
          startTime: initialStartTime,
          endTime: initialEndTime,
          caps: JSON.stringify(toCapacities(mainValues)),
        })

        const { data: mainSignups } = await supabase
          .from('signups')
          .select('id, gender')
          .eq('event_id', eventId)
          .is('role_id', null)
        setMainSignedUp(countSignedUp(mainSignups || []))

        const { data: roleRows } = await supabase
          .from('event_roles')
          .select(
            'id, role_name, start_time, end_time, capacity, brother_capacity, sister_capacity, google_calendar_event_id, signups(id, gender)'
          )
          .eq('event_id', eventId)

        setRoles(
          (roleRows || []).map((r: any) => ({
            key: String(r.id),
            dbId: r.id,
            isNew: false,
            name: r.role_name,
            startTime: r.start_time ? new Date(r.start_time).toTimeString().slice(0, 5) : '',
            endTime: r.end_time ? new Date(r.end_time).toTimeString().slice(0, 5) : '',
            ...toAudienceValues(r.capacity, r.brother_capacity, r.sister_capacity, { brother: 1, sister: 1 }),
            googleCalendarEventId: r.google_calendar_event_id,
            signedUp: countSignedUp(r.signups || []),
          }))
        )
      }
      setLoading(false)
    }
    fetchEvent()
  }, [eventId])

  function addRole() {
    setRoles((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        dbId: null,
        isNew: true,
        name: '',
        startTime: '',
        endTime: '',
        audience: 'everyone',
        capacity: 1,
        brotherCapacity: 1,
        sisterCapacity: 1,
        googleCalendarEventId: null,
        signedUp: { total: 0, brothers: 0, sisters: 0 },
      },
    ])
  }

  function updateRole(key: string, patch: Partial<RoleState>) {
    setRoles((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeRole(key: string) {
    const role = roles.find((r) => r.key === key)
    if (role?.dbId) setRemovedRoleIds((prev) => [...prev, role.dbId!])
    setRoles((prev) => prev.filter((r) => r.key !== key))
  }

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

    if (roles.length === 0) {
      const capacityError = validateCapacity('This event', main)
      if (capacityError) {
        setStatus('error')
        setErrorMessage(capacityError)
        return
      }
    }

    for (const role of roles) {
      if (!role.name.trim()) {
        setStatus('error')
        setErrorMessage('Every role needs a name.')
        return
      }
      const capacityError = validateCapacity(`"${role.name}"`, role)
      if (capacityError) {
        setStatus('error')
        setErrorMessage(capacityError)
        return
      }
    }

    setStatus('submitting')
    setErrorMessage('')

    // With roles, capacity lives on each role, so the event just stores the combined total.
    const eventCaps =
      roles.length > 0
        ? {
            total: roles.reduce((sum, r) => sum + toCapacities(r).total, 0),
            brother: null as number | null,
            sister: null as number | null,
          }
        : toCapacities(main)

    const { error } = await supabase
      .from('events')
      .update({
        name,
        description,
        location,
        event_date: newStartDateTime.toISOString(),
        event_end_date: newEndDateTime ? newEndDateTime.toISOString() : null,
        v_capacity: eventCaps.total,
        brother_capacity: eventCaps.brother,
        sister_capacity: eventCaps.sister,
        group_chat_link: groupChatLink || null,
      })
      .eq('id', eventId)

    if (error) {
      setStatus('error')
      setErrorMessage('Something went wrong — try again.')
      return
    }

    for (const removedId of removedRoleIds) {
      const { data: stillThere } = await supabase
        .from('event_roles')
        .select('google_calendar_event_id')
        .eq('id', removedId)
        .single()

      if (stillThere?.google_calendar_event_id) {
        try {
          await fetch('/api/calendar/delete-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calendarEventId: stillThere.google_calendar_event_id }),
          })
        } catch (err) {
          console.error('Role calendar delete failed:', err)
        }
      }

      await supabase.from('event_roles').delete().eq('id', removedId)
    }

    for (const role of roles) {
      let roleStart: string
      let roleEnd: string

      if (role.startTime) {
        const [h, m] = role.startTime.split(':').map(Number)
        const d = new Date(eventDay)
        d.setHours(h, m)
        roleStart = d.toISOString()
      } else {
        roleStart = newStartDateTime.toISOString()
      }

      if (role.endTime) {
        const [h, m] = role.endTime.split(':').map(Number)
        const d = new Date(eventDay)
        d.setHours(h, m)
        roleEnd = d.toISOString()
      } else {
        roleEnd = newEndDateTime ? newEndDateTime.toISOString() : roleStart
      }

      const caps = toCapacities(role)

      if (role.isNew) {
        const { data: insertedRole } = await supabase
          .from('event_roles')
          .insert({
            event_id: eventId,
            role_name: role.name,
            start_time: roleStart,
            end_time: roleEnd,
            capacity: caps.total,
            brother_capacity: caps.brother,
            sister_capacity: caps.sister,
          })
          .select('id')
          .single()

        if (insertedRole) {
          try {
            const res = await fetch('/api/calendar/create-event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                summary: `${name} — ${role.name}`,
                description,
                location,
                startDateTime: roleStart,
                endDateTime: roleEnd,
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
            console.error('New role calendar sync failed:', err)
          }
        }
      } else if (role.dbId) {
        await supabase
          .from('event_roles')
          .update({
            role_name: role.name,
            start_time: roleStart,
            end_time: roleEnd,
            capacity: caps.total,
            brother_capacity: caps.brother,
            sister_capacity: caps.sister,
          })
          .eq('id', role.dbId)

        if (role.googleCalendarEventId) {
          try {
            await fetch('/api/calendar/update-event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                calendarEventId: role.googleCalendarEventId,
                summary: `${name} — ${role.name}`,
                description,
                location,
                startDateTime: roleStart,
                endDateTime: roleEnd,
              }),
            })
          } catch (err) {
            console.error('Role calendar update failed:', err)
          }
        }
      }
    }

    const { data: signupsData } = await supabase
      .from('signups')
      .select('volunteers(email)')
      .eq('event_id', eventId)

    const emails = signupsData?.map((s: any) => s.volunteers?.email).filter(Boolean) || []

    const changedFields: string[] = []
    if (location !== original.location) changedFields.push('location')
    if (
      eventDay.toDateString() !== original.eventDay ||
      startTime !== original.startTime ||
      endTime !== original.endTime
    ) {
      changedFields.push('date')
    }
    if (description !== original.description) changedFields.push('description')
    if (name !== original.name) changedFields.push('name')
    if (roles.length === 0 && JSON.stringify(toCapacities(main)) !== original.caps) {
      changedFields.push('capacity')
    }

    if (emails.length > 0 && changedFields.length > 0) {
      await fetch('/api/send-update-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails,
          eventName: name,
          eventDate: newStartDateTime.toISOString(),
          location,
          description,
          changedFields,
        }),
      })
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
      <main className="p-4 sm:p-8 max-w-md mx-auto overflow-x-hidden">
        <h1 className="text-xl font-bold mb-4 text-msa-green-dark dark:text-msa-cream">Edit Event</h1>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 bg-white dark:bg-[#2A2A2D] rounded-xl p-4 sm:p-6 shadow-sm border-t-4 border-msa-gold transition-colors min-w-0"
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
              className={`${textareaClass} w-full`}
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
            <label className={labelClass}>
              Group chat link (optional — only sent to volunteers who sign up, never shown publicly)
            </label>
            <input
              placeholder="e.g. WhatsApp group invite link"
              value={groupChatLink}
              onChange={(e) => setGroupChatLink(e.target.value)}
              className={`${inputClass} w-full`}
            />
          </div>

          <div>
            <label className={labelClass}>Date</label>
            <div className="flex justify-center overflow-x-auto">
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

          <div className="flex flex-col sm:flex-row gap-3 min-w-0">
            <div className="flex-1 min-w-0">
              <label className={labelClass}>Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className={`${inputClass} w-full`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className={labelClass}>End time (optional)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                min={startTime || undefined}
                className={`${inputClass} w-full`}
              />
            </div>
          </div>

          <div className="min-w-0">
            {roles.length === 0 ? (
              <AudienceFields
                values={main}
                onChange={(patch) => setMain((prev) => ({ ...prev, ...patch }))}
                singleLabel="Volunteers needed"
                labelClass={labelClass}
                signedUp={mainSignedUp}
              />
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Volunteer limits are set per role below.
              </p>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 min-w-0">
            <div className="flex items-center justify-between mb-2 gap-2">
              <label className={labelClass}>Roles</label>
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
                    key={role.key}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col gap-2 min-w-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        placeholder="Role name (e.g. Set-up)"
                        value={role.name}
                        onChange={(e) => updateRole(role.key, { name: e.target.value })}
                        className={`${inputClass} flex-1 min-w-0`}
                      />
                      <button
                        type="button"
                        onClick={() => removeRole(role.key)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-600/10 transition shrink-0"
                        aria-label="Remove role"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                      <div className="flex-1 min-w-0">
                        <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                          Start time
                        </label>
                        <input
                          type="time"
                          value={role.startTime}
                          onChange={(e) => updateRole(role.key, { startTime: e.target.value })}
                          className={`${inputClass} w-full`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                          End time
                        </label>
                        <input
                          type="time"
                          value={role.endTime}
                          onChange={(e) => updateRole(role.key, { endTime: e.target.value })}
                          className={`${inputClass} w-full`}
                        />
                      </div>
                    </div>
                    <AudienceFields
                      values={role}
                      onChange={(patch) => updateRole(role.key, patch)}
                      singleLabel="Capacity"
                      labelClass="text-xs text-gray-600 dark:text-gray-400 block mb-1"
                      signedUp={role.signedUp}
                    />
                  </div>
                ))}
              </div>
            )}
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