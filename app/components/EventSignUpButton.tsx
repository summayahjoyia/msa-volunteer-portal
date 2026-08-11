'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'

export default function EventSignUpButton({
  eventId,
  eventName,
  eventDate,
  location,
  spotsOpen,
}: {
  eventId: number
  eventName: string
  eventDate: string
  location: string
  spotsOpen: number
}) {
  const supabase = createClient()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [volunteer, setVolunteer] = useState<{ id: number; name: string; email: string } | null>(null)
  const [signupId, setSignupId] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'signed_up' | 'already' | 'cancelled' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadVolunteer() {
      if (authLoading) return
      if (!user?.email) {
        setLoading(false)
        return
      }

      const { data: existing } = await supabase
        .from('volunteers')
        .select('id, name, email')
        .eq('email', user.email)
        .single()

      if (existing) {
        setVolunteer(existing)
        const { data: existingSignup } = await supabase
          .from('signups')
          .select('id')
          .eq('event_id', eventId)
          .eq('volunteer_id', existing.id)
          .single()
        if (existingSignup) {
          setSignupId(existingSignup.id)
          setStatus('already')
        }
      }
      setLoading(false)
    }
    loadVolunteer()
  }, [eventId, authLoading, user?.email])

  async function syncCalendarAttendee(action: 'add' | 'remove', email: string) {
    const { data: eventRow } = await supabase
      .from('events')
      .select('google_calendar_event_id')
      .eq('id', eventId)
      .single()

    const calendarEventId = eventRow?.google_calendar_event_id
    if (!calendarEventId) return

    try {
      await fetch(`/api/calendar/${action === 'add' ? 'add-attendee' : 'remove-attendee'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarEventId, email }),
      })
    } catch (err) {
      console.error('Calendar attendee sync failed:', err)
    }
  }

  async function handleSignUp() {
    if (!volunteer) return
    setStatus('submitting')

    const { data: inserted, error: signupError } = await supabase
      .from('signups')
      .insert({ event_id: eventId, volunteer_id: volunteer.id, status: 'confirmed' })
      .select('id')
      .single()

    if (signupError) {
      setStatus('error')
      setErrorMessage("Something went wrong — you may have already signed up.")
      return
    }

    setSignupId(inserted.id)

    await fetch('/api/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: volunteer.email,
        name: volunteer.name,
        eventName,
        eventDate,
        location,
      }),
    })

    await syncCalendarAttendee('add', volunteer.email)

    setStatus('signed_up')
    router.refresh()
  }

  async function handleCancel() {
    if (!signupId || !volunteer) return
    setStatus('submitting')

    const { error } = await supabase.from('signups').delete().eq('id', signupId)

    if (error) {
      setStatus('error')
      setErrorMessage('Something went wrong cancelling your spot — try again.')
      return
    }

    await syncCalendarAttendee('remove', volunteer.email)

    setSignupId(null)
    setStatus('cancelled')
    router.refresh()
  }

  if (authLoading || loading) return null

  if (!user || !volunteer) {
    if (spotsOpen <= 0) {
      return <p className="mt-3 text-sm text-gray-500 font-medium">This event is full.</p>
    }
    return (
      <p className="mt-3 text-sm text-gray-500">Sign in to sign up for this event.</p>
    )
  }

  if (status === 'signed_up' || status === 'already') {
    return (
      <div className="mt-2 text-sm">
        <p className="text-msa-green-dark dark:text-msa-cream font-medium">
          {status === 'already' ? "You're signed up for this event." : "You're signed up! Check your email for confirmation."}
        </p>
        {status === 'signed_up' && (
          <p className="text-msa-gold italic mt-1.5 text-[13px]">
            JazakAllah Khair — may Allah reward you for stepping up to serve your community.
          </p>
        )}
        <button
          onClick={handleCancel}
          className="mt-3 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs px-3 py-1.5 rounded-lg hover:border-red-300 hover:text-red-500 transition"
        >
          Can't make it
        </button>
      </div>
    )
  }

  if (status === 'cancelled') {
    if (spotsOpen <= 0) {
      return <p className="mt-2 text-sm text-gray-500 font-medium">This event is now full.</p>
    }
    return (
      <div className="mt-2 text-sm">
        <p className="text-gray-500 dark:text-gray-400">You've cancelled your spot for this event.</p>
        <button
          onClick={handleSignUp}
          className="mt-2 bg-msa-green text-white rounded-lg px-3 py-1.5 text-sm hover:bg-msa-green-dark transition"
        >
          Sign Up Again
        </button>
      </div>
    )
  }

  if (spotsOpen <= 0) {
    return <p className="mt-3 text-sm text-gray-500 font-medium">This event is full.</p>
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleSignUp}
        disabled={status === 'submitting'}
        className="bg-msa-green text-white rounded-lg px-3 py-1.5 text-sm hover:bg-msa-green-dark transition"
      >
        {status === 'submitting' ? '...' : 'Sign Up'}
      </button>
      {status === 'error' && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
    </div>
  )
}