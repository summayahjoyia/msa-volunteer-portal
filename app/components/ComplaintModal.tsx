'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { X } from 'lucide-react'

export default function ComplaintModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error' | 'limit'>('idle')

  useEffect(() => {
    if (user?.email) setEmail(user.email)
    if (user?.name) setName(user.name)
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, name, email }),
      })
      const result = await res.json()

      if (result.success) {
        setStatus('success')
        setTitle('')
        setBody('')
      } else if (result.error === 'LIMIT_REACHED') {
        setStatus('limit')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#2A2A2D] rounded-xl p-5 w-full max-w-sm shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <h2 className="text-base font-semibold text-msa-green-dark dark:text-msa-cream mb-3">
          Report an issue or share feedback
        </h2>

        {status === 'success' ? (
          <p className="text-sm text-msa-green-dark dark:text-msa-cream">
            Thanks — your feedback was submitted!
          </p>
        ) : status === 'limit' ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You've reached the maximum number of submissions for this email address. If you have more to share, please reach out to an MSA exec directly.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              placeholder="Short summary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="border rounded px-2 py-1.5 text-sm bg-white dark:bg-[#1F1F21] dark:border-gray-700 dark:text-gray-100"
            />
            <textarea
              placeholder="Describe the issue or suggestion..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={4}
              className="border rounded px-2 py-1.5 text-sm bg-white dark:bg-[#1F1F21] dark:border-gray-700 dark:text-gray-100"
            />

            {user ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Submitting as <span className="font-medium">{name || email}</span>
              </p>
            ) : (
              <>
                <input
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border rounded px-2 py-1.5 text-sm bg-white dark:bg-[#1F1F21] dark:border-gray-700 dark:text-gray-100"
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border rounded px-2 py-1.5 text-sm bg-white dark:bg-[#1F1F21] dark:border-gray-700 dark:text-gray-100"
                />
              </>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="mt-1 bg-msa-green text-white rounded-lg px-3 py-1.5 text-sm hover:bg-msa-green-dark transition"
            >
              {status === 'submitting' ? 'Submitting...' : 'Submit'}
            </button>
            {status === 'error' && (
              <p className="text-red-500 text-xs mt-1">Something went wrong — try again.</p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
