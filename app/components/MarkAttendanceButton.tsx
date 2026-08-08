'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'

export default function MarkAttendanceButton({ signupId, currentStatus }: { signupId: number; currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const router = useRouter()

  async function updateStatus(newStatus: string) {
    const nextStatus = status === newStatus ? 'confirmed' : newStatus
    setLoading(true)
    const { error } = await supabase
      .from('signups')
      .update({ status: nextStatus })
      .eq('id', signupId)
    setLoading(false)
    if (!error) {
      setStatus(nextStatus)
      router.refresh()
    }
  }

  const isAttended = status === 'attended'
  const isAbsent = status === 'absent'

  return (
    <div className="flex gap-3">
      <button
        onClick={() => updateStatus('attended')}
        disabled={loading}
        aria-label="Mark attended"
        className={`w-7 h-7 rounded-md border flex items-center justify-center transition ${
          isAttended
            ? 'bg-msa-green border-msa-green text-white'
            : 'border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-500 hover:border-msa-green hover:text-msa-green'
        }`}
      >
        <Check size={16} />
      </button>
      <button
        onClick={() => updateStatus('absent')}
        disabled={loading}
        aria-label="Mark absent"
        className={`w-7 h-7 rounded-md border flex items-center justify-center transition ${
          isAbsent
            ? 'bg-red-600 border-red-600 text-white'
            : 'border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-500 hover:border-red-600 hover:text-red-600'
        }`}
      >
        <X size={16} />
      </button>
    </div>
  )
}