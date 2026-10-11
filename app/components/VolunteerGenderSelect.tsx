'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

type Gender = 'sister' | 'brother'

export default function VolunteerGenderSelect({
  volunteerId,
  currentGender,
  onChanged,
}: {
  volunteerId: number
  currentGender: Gender | null
  onChanged?: (gender: Gender) => void
}) {
  const supabase = createClient()
  const [gender, setGender] = useState<Gender | null>(currentGender)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Gender
    if (next === gender) return

    setSaving(true)
    setMessage('')

    const { data, error } = await supabase.rpc('admin_set_gender', {
      target_volunteer_id: volunteerId,
      new_gender: next,
    })

    setSaving(false)

    if (error) {
      setMessage('Something went wrong. Please try again.')
      return
    }

    if (data === 'ok') {
      setGender(next)
      onChanged?.(next)
    } else if (data === 'has_upcoming_signups') {
      setMessage('Has upcoming sign-ups. Cancel those first, then change this.')
    } else if (data === 'forbidden') {
      setMessage('Only admins can change this.')
    } else {
      setMessage('Could not update. Please try again.')
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={gender ?? ''}
        onChange={handleChange}
        disabled={saving}
        className="h-8 border rounded px-2 text-sm bg-white dark:bg-[#2A2A2D] dark:border-gray-700 dark:text-gray-100 disabled:opacity-50"
      >
        <option value="" disabled>
          Not set
        </option>
        <option value="sister">Sister</option>
        <option value="brother">Brother</option>
      </select>
      {message && <p className="text-xs text-red-500 max-w-[220px]">{message}</p>}
    </div>
  )
}