'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin` },
    })
    if (error) {
      console.error('Login error:', error)
      alert(error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) return <p className="p-8">Check your email for a login link.</p>

  return (
    <main className="p-8 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-4">Admin Login</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-2">
        <input
          type="email"
          placeholder="you@ualberta.ca"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border rounded px-2 py-1"
        />
        <button type="submit" className="bg-black text-white rounded px-3 py-1">
          Send Login Link
        </button>
      </form>
    </main>
  )
}