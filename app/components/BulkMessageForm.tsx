'use client'

import { useState } from 'react'

export default function BulkMessageForm({ emails }: { emails: string[] }) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')

    const res = await fetch('/api/send-bulk-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails, subject, message }),
    })

    setStatus(res.ok ? 'sent' : 'error')
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm underline text-blue-600 mt-2">
        Message all sign-ups
      </button>
    )
  }

  if (status === 'sent') return <p className="text-sm text-green-600 mt-2">Message sent!</p>

  return (
    <form onSubmit={handleSend} className="mt-2 flex flex-col gap-2 border-t pt-2">
      <input
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
        className="border rounded px-2 py-1 text-sm"
      />
      <textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        className="border rounded px-2 py-1 text-sm"
        rows={3}
      />
      <div className="flex gap-2">
        <button type="submit" disabled={status === 'sending'} className="bg-black text-white rounded px-3 py-1 text-sm">
          {status === 'sending' ? 'Sending...' : 'Send'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500">
          Cancel
        </button>
      </div>
      {status === 'error' && <p className="text-red-500 text-sm">Something went wrong — try again.</p>}
    </form>
  )
}