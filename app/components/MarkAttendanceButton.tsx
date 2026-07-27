'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function MarkAttendanceButton({ signupId, currentStatus }: { signupId: number; currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function markAttended() {
    setLoading(true)
    const { error } = await supabase
      .from('signups')
      .update({ status: 'attended' })
      .eq('id', signupId)
    setLoading(false)
    if (!error) {
      router.refresh()
    }
  }

  if (currentStatus === 'attended') {
    return <span className="text-green-600 text-sm">✓ Attended</span>
  }

  return (
    <button
      onClick={markAttended}
      disabled={loading}
      className="text-sm bg-black text-white px-2 py-0.5 rounded"
    >
      {loading ? '...' : 'Mark Attended'}
    </button>
  )
}