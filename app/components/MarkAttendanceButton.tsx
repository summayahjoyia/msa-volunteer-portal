'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed', color: 'text-gray-500' },
  { value: 'attended', label: 'Attended', color: 'text-msa-green' },
  { value: 'absent', label: 'Absent', color: 'text-red-600' },
]

export default function MarkAttendanceButton({ signupId, currentStatus }: { signupId: number; currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const router = useRouter()

  async function updateStatus(newStatus: string) {
    setLoading(true)
    const { error } = await supabase
      .from('signups')
      .update({ status: newStatus })
      .eq('id', signupId)
    setLoading(false)
    if (!error) {
      setStatus(newStatus)
      router.refresh()
    }
  }

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => updateStatus(e.target.value)}
      className={`text-xs border rounded-md px-2 py-1 bg-white ${
        STATUS_OPTIONS.find((o) => o.value === status)?.color || 'text-gray-500'
      }`}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value} className="text-gray-900">
          {opt.label}
        </option>
      ))}
    </select>
  )
}