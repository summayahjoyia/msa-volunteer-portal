'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SignUpForm({
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
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email.toLowerCase().endsWith('@ualberta.ca')) {
      setStatus('error')
      setErrorMessage('Please use your @ualberta.ca email.')
      return
    }

    setStatus('submitting')

    let { data: volunteer } = await supabase
      .from('volunteers')
      .select('id')
      .eq('email', email)
      .single()

    if (!volunteer) {
      const { data: newVolunteer, error: insertError } = await supabase
        .from('volunteers')
        .insert({ email, name })
        .select('id')
        .single()
      if (insertError) {
        setStatus('error')
        setErrorMessage('Something went wrong creating your profile — try again.')
        return
      }
      volunteer = newVolunteer
    }

    const { data: existingSignup } = await supabase
      .from('signups')
      .select('id')
      .eq('event_id', eventId)
      .eq('volunteer_id', volunteer.id)
      .single()

    if (existingSignup) {
      setStatus('error')
      setErrorMessage("You've already signed up for this event!")
      return
    }

    const { error: signupError } = await supabase
      .from('signups')
      .insert({ event_id: eventId, volunteer_id: volunteer.id, status: 'confirmed' })

    if (signupError) {
      setStatus('error')
      setErrorMessage('Something went wrong signing you up — try again.')
      return
    }

    await fetch('/api/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, eventName, eventDate, location }),
    })

    setStatus('success')
  }

  if (status === 'success') return (
    <div className="mt-2 text-sm">
      <p className="text-msa-green font-medium">You're signed up! Check your email for confirmation.</p>
      <p className="text-msa-gold italic mt-1">JazakAllah Khair — may Allah reward you for stepping up to serve your community.</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2 flex-wrap">
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="border rounded px-2 py-1 text-sm"
      />
      <input
        type="email"
        placeholder="you@ualberta.ca"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border rounded px-2 py-1 text-sm"
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="bg-msa-green text-white rounded-lg px-3 py-1.5 text-sm hover:bg-msa-green-dark transition"
      >
        {status === 'submitting' ? '...' : 'Sign Up'}
      </button>
      {status === 'error' && <p className="text-red-500 text-sm w-full">{errorMessage}</p>}
    </form>
  )
}