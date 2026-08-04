'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function EventSignUpButton({
  eventId,
  eventName,
  eventDate,
  location,
}: {
  eventId: number
  eventName: string
  eventDate: string
  location: string
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [volunteer, setVolunteer] = useState<{ id: number; name: string; email: string } | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'signed_up' | 'already' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadVolunteer() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
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
        if (existingSignup) setStatus('already')
      }
      setLoading(false)
    }
    loadVolunteer()
  }, [eventId])

  async function handleSignUp() {
    if (!volunteer) return
    setStatus('submitting')

    const { error: signupError } = await supabase
      .from('signups')
      .insert({ event_id: eventId, volunteer_id: volunteer.id, status: 'confirmed' })

    if (signupError) {
      setStatus('error')
      setErrorMessage("Something went wrong — you may have already signed up.")
      return
    }

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

    setStatus('signed_up')
  }

  if (loading) return null

  if (!volunteer) {
    return (
      <p className="mt-3 text-sm text-gray-500">Sign in with Google above to sign up.</p>
    )
  }

  if (status === 'signed_up' || status === 'already') {
    return (
      <div className="mt-2 text-sm">
        <p className="text-msa-green font-medium">
          {status === 'already' ? "You're already signed up for this event." : "You're signed up! Check your email for confirmation."}
        </p>
        {status === 'signed_up' && (
          <p className="text-msa-gold italic mt-1">
            JazakAllah Khair — may Allah reward you for stepping up to serve your community.
          </p>
        )}
      </div>
    )
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