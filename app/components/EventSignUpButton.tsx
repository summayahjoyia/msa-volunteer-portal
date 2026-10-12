'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import GroupCounts from './GroupCounts'

type Gender = 'sister' | 'brother'

type EventSignUpButtonProps = {
  eventId: number
  eventName: string
  eventDate: string
  location: string
  spotsOpen: number
  brotherCapacity?: number | null
  sisterCapacity?: number | null
  brotherTaken?: number
  sisterTaken?: number
}

export default function EventSignUpButton({
  eventId,
  eventName,
  eventDate,
  location,
  spotsOpen,
  brotherCapacity = null,
  sisterCapacity = null,
  brotherTaken = 0,
  sisterTaken = 0,
}: EventSignUpButtonProps) {
  const supabase = createClient()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [volunteer, setVolunteer] = useState<{
    id: number
    name: string
    email: string
    gender: Gender | null
  } | null>(null)
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
        .select('id, name, email, gender')
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

    const { data: freshEvent } = await supabase
      .from('events')
      .select('v_capacity, signups(id)')
      .eq('id', eventId)
      .single()

    const currentCount = freshEvent?.signups?.length || 0
    const capacity = freshEvent?.v_capacity ?? 0

    if (currentCount >= capacity) {
      setStatus('error')
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
      setStatus('error')
      if (signupError.message?.includes('EVENT_FULL')) {
        setErrorMessage('Sorry, this event just filled up.')
        router.refresh()
      } else {
        setErrorMessage("Something went wrong — you may have already signed up.")
      }
      return
    }

    setSignupId(inserted.id)

    const { data: eventInfo } = await supabase
      .from('events')
      .select('group_chat_link')
      .eq('id', eventId)
      .single()

    await fetch('/api/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: volunteer.email,
        name: volunteer.name,
        eventName,
        eventDate,
        location,
        groupChatLink: eventInfo?.group_chat_link || null,
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

  // Brothers/sisters split: spot counts per group, and the viewer's own group decides if they can sign up
  const isSplit = brotherCapacity != null || sisterCapacity != null
  const brothers = { cap: brotherCapacity ?? 0, taken: brotherTaken }
  const sisters = { cap: sisterCapacity ?? 0, taken: sisterTaken }
  const viewerGender = volunteer?.gender ?? null
  const myGroup = viewerGender === 'brother' ? brothers : viewerGender === 'sister' ? sisters : null
  const myOpen = myGroup ? Math.max(myGroup.cap - myGroup.taken, 0) : 0
  // In a split event, a group that is closed or full (or an unknown group) just gets a disabled button
  const blocked = isSplit && myOpen <= 0
  const closedToViewer = isSplit && myGroup !== null && myGroup.cap === 0

  const counts = isSplit ? (
    <div className="mb-2">
      <GroupCounts brothers={brothers} sisters={sisters} viewerGender={viewerGender} />
    </div>
  ) : null

  // Dims the whole card (it sits over the card, which is position: relative)
  const veil = closedToViewer ? (
    <div className="absolute inset-0 rounded-xl bg-gray-200/60 dark:bg-black/40 pointer-events-none" />
  ) : null

  const signUpButtonClass =
    'bg-msa-green text-white rounded-lg px-3 py-1.5 text-sm hover:bg-msa-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-msa-green'

  if (authLoading || loading) return null

  if (!user || !volunteer) {
    if (spotsOpen <= 0) {
      return <p className="mt-3 text-sm text-gray-500 font-medium">This event is full.</p>
    }
    return (
      <div className="mt-3">
        {counts}
        <p className="text-sm text-gray-500">Sign in to sign up for this event.</p>
      </div>
    )
  }

  if (status === 'signed_up' || status === 'already') {
    return (
      <div className="mt-2 text-sm">
        {counts}
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
    if (!isSplit && spotsOpen <= 0) {
      return <p className="mt-2 text-sm text-gray-500 font-medium">This event is now full.</p>
    }
    return (
      <div className="mt-2 text-sm">
        {veil}
        {counts}
        <p className="text-gray-500 dark:text-gray-400">You've cancelled your spot for this event.</p>
        <button onClick={handleSignUp} disabled={blocked} className={`mt-2 ${signUpButtonClass}`}>
          Sign Up Again
        </button>
      </div>
    )
  }

  if (!isSplit && spotsOpen <= 0) {
    return <p className="mt-3 text-sm text-gray-500 font-medium">This event is full.</p>
  }

  return (
    <div className="mt-3">
      {veil}
      {counts}
      <button
        onClick={handleSignUp}
        disabled={status === 'submitting' || blocked}
        className={signUpButtonClass}
      >
        {status === 'submitting' ? '...' : 'Sign Up'}
      </button>
      {status === 'error' && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
    </div>
  )
}