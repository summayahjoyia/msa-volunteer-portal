'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from './AuthProvider'

type Gender = 'sister' | 'brother'

export default function GenderPrompt() {
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()

  const [needsGender, setNeedsGender] = useState(false)
  const [volunteerId, setVolunteerId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Gender | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkGender() {
      if (authLoading) return
      if (!user?.email) {
        setNeedsGender(false)
        return
      }

      const { data } = await supabase
        .from('volunteers')
        .select('id, gender')
        .eq('email', user.email)
        .single()

      if (data && !data.gender) {
        setVolunteerId(data.id)
        setNeedsGender(true)
      } else {
        setNeedsGender(false)
      }
    }
    checkGender()
  }, [authLoading, user?.email])

  // Lock page scroll behind the prompt while it's showing
  useEffect(() => {
    if (!needsGender) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [needsGender])

  async function handleConfirm() {
  if (!selected) return
  setSaving(true)
  setError('')

  const { data, error: rpcError } = await supabase.rpc('set_my_gender', {
    new_gender: selected,
  })

  if (rpcError || data !== true) {
    setError('Something went wrong. Please try again.')
    setSaving(false)
    return
  }

  setNeedsGender(false)
  setSaving(false)
}

  if (!needsGender) return null

  const label = selected === 'sister' ? 'Sister' : 'Brother'

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-[#2A2A2D] rounded-xl p-6 w-full max-w-sm shadow-lg border-t-4 border-msa-gold"
      >
        {!selected ? (
          <>
            <h2 className="text-lg font-semibold text-msa-green-dark dark:text-msa-cream">
              One quick thing before you continue
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
              Please choose one so we can match you to the right volunteer spots.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setSelected('sister')}
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 hover:border-msa-green hover:text-msa-green transition"
              >
                Sister
              </button>
              <button
                onClick={() => setSelected('brother')}
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 hover:border-msa-green hover:text-msa-green transition"
              >
                Brother
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-msa-green-dark dark:text-msa-cream">
              Confirm your selection
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
              You selected <span className="font-medium">{label}</span>. If this was a mistake,
              email{' '}
              <a href="mailto:msaualberta@gmail.com" className="text-msa-green underline">
                msaualberta@gmail.com
              </a>{' '}
              to have it changed.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setSelected(null)
                  setError('')
                }}
                disabled={saving}
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:border-gray-400 transition disabled:opacity-50"
              >
                Go back
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 bg-msa-green text-white rounded-lg py-2.5 text-sm font-medium hover:bg-msa-green-dark transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}