'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'

type EventSignUpButtonProps = {
  eventId: number
  eventName: string
  eventDate: string
  location: string
  spotsOpen: number
}

type Status = 'idle' | 'signed_up' | 'already' | 'cancelled'

export default function EventSignUpButton({
  eventId,
  eventName,
  eventDate,
  location,
  spotsOpen,
}: EventSignUpButtonProps) {
  const supabase = createClient()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [volunteer, setVolunteer] = useState<{ id: number; name: string; email: string } | null>(null)
  const [signupId, setSignupId] = useState<number | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [pending, setPending] = useState(false)
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
    setPending(true)
    setErrorMessage('')

    const { data: freshEvent } = await supabase
      .from('events')
      .select('v_capacity, signups(id)')
      .eq('id', eventId)
      .single()

    const currentCount = freshEvent?.signups?.length || 0
    const capacity = freshEvent?.v_capacity ?? 0

    if (currentCount >= capacity) {
      setPending(false)
      setErrorMessage('Sorry, this event just filled up.')
      router.refresh()
      return
    }

    const { data: inserted, error: signupError } = await supabase
      .from('signups')
      .insert({ event_id: eventId, volunteer_id: volunteer.id, status: 'confirmed' })
      .select('id')
      .single()

    if (signupError) {
      setPending(false)
      if (signupError.message?.includes('EVENT_FULL')) {
        setErrorMessage('Sorry, this event just filled up.')
        router.refresh()
      } else {
        setErrorMessage('Something went wrong. You may have already signed up.')
      }
      return
    }

    setSignupId(inserted.id)

    await syncCalendarAttendee('add', volunteer.email)

    setStatus('signed_up')
    setPending(false)
    router.refresh()
  }

  async function handleCancel() {
    if (!signupId || !volunteer) return
    setPending(true)
    setErrorMessage('')

    const { error } = await supabase.from('signups').delete().eq('id', signupId)

    if (error) {
      setPending(false)
      setErrorMessage('Something went wrong cancelling your spot. Try again.')
      return
    }

    await syncCalendarAttendee('remove', volunteer.email)

    setSignupId(null)
    setStatus('cancelled')
    setPending(false)
    router.refresh()
  }

  const ready = !authLoading && !loading
  const isSignedUp = status === 'signed_up' || status === 'already'
  const isFull = spotsOpen <= 0

  // One message slot, filled differently per state. Empty string keeps the slot
  // reserved but blank.
  let message = ''
  if (ready) {
    if (isSignedUp) {
      message = "You're signed up for this event. Check your email for a calendar invite."
    } else if (!user || !volunteer) {
      message = isFull ? 'This event is full.' : 'Sign in to sign up for this event.'
    } else if (isFull) {
      message = status === 'cancelled' ? 'This event is now full.' : 'This event is full.'
    } else if (status === 'cancelled') {
      message = "You've cancelled your spot for this event."
    }
  }

  const messageIsStrong = isSignedUp || isFull

  // One button slot. When there's no action available the button still renders,
  // invisible, so it keeps holding its space.
  let action:
    | { label: string; pendingLabel: string; onClick: () => void; variant: 'primary' | 'ghost' }
    | null = null

  if (ready && user && volunteer) {
    if (isSignedUp) {
      action = {
        label: "Can't make it",
        pendingLabel: 'Cancelling',
        onClick: handleCancel,
        variant: 'ghost',
      }
    } else if (!isFull) {
      action = {
        label: status === 'cancelled' ? 'Sign Up Again' : 'Sign Up',
        pendingLabel: 'Signing up',
        onClick: handleSignUp,
        variant: 'primary',
      }
    }
  }

  const buttonBase =
    'rounded-lg px-3 py-1.5 min-w-[7.5rem] transition disabled:opacity-60 disabled:cursor-not-allowed'
  const buttonVariant =
    action?.variant === 'ghost'
      ? 'border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs hover:border-red-300 hover:text-red-500'
      : 'bg-msa-green text-white text-sm hover:bg-msa-green-dark'

  return (
    <div className="mt-2 text-sm">
      {/* Message slot: two lines reserved so a one-line and a two-line message
          take up the same room. */}
      <p
        aria-live="polite"
        className={`min-h-[2.5rem] ${
          messageIsStrong
            ? 'text-msa-green-dark dark:text-msa-cream font-medium'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {message}
      </p>

      {/* Du'a slot: always rendered so it holds its height in every state,
          including when it wraps on narrow screens. */}
      <p
        aria-hidden={status !== 'signed_up'}
        className={`text-msa-gold italic mt-1.5 text-[13px] ${
          status === 'signed_up' ? '' : 'invisible'
        }`}
      >
        JazakAllah Khair — may Allah reward you for stepping up to serve your community.
      </p>

      {/* Button slot: always rendered, hidden when there's nothing to do. */}
      <button
        onClick={action?.onClick}
        disabled={!action || pending}
        aria-hidden={!action}
        tabIndex={action ? undefined : -1}
        className={`mt-3 ${buttonBase} ${buttonVariant} ${
          action ? '' : 'invisible pointer-events-none'
        }`}
      >
        {action ? (pending ? action.pendingLabel : action.label) : 'Sign Up'}
      </button>

      {/* Error slot: one line reserved so an error doesn't push the card taller. */}
      <p className="text-red-500 text-sm mt-1 min-h-[1.25rem]">{errorMessage}</p>
    </div>
  )
}