'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SignUpForm({ eventId }: { eventId: number }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
        return
      }
      volunteer = newVolunteer
    }

    const { error: signupError } = await supabase
      .from('signups')
      .insert({ event_id: eventId, volunteer_id: volunteer.id, status: 'confirmed' })

    setStatus(signupError ? 'error' : 'success')
  }

  if (status === 'success') return <p className="text-green-600 text-sm mt-2">You're signed up!</p>

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
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border rounded px-2 py-1 text-sm"
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="bg-black text-white rounded px-3 py-1 text-sm"
      >
        {status === 'submitting' ? '...' : 'Sign Up'}
      </button>
      {status === 'error' && <p className="text-red-500 text-sm w-full">Something went wrong — try again.</p>}
    </form>
  )
}