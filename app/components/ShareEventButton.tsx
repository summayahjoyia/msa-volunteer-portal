'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

export default function ShareEventButton({ eventId }: { eventId: number }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/events/${eventId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="text-xs text-gray-400 hover:text-msa-green flex items-center gap-1.5 transition"
      aria-label="Copy shareable link"
    >
      {copied ? <Check size={13} /> : <Share2 size={13} />}
      {copied ? 'Link copied!' : 'Share'}
    </button>
  )
}