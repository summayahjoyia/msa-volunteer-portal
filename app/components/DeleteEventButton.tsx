'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function DeleteEventButton({ eventId, seriesId }: { eventId: number; seriesId: string | null }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function notifyAndDelete(ids: number[]) {
    for (const id of ids) {
      const { data: event } = await supabase
        .from('events')
        .select('name, event_date, signups(volunteers(email))')
        .eq('id', id)
        .single()

      if (event) {
        const emails = event.signups?.map((s: any) => s.volunteers?.email).filter(Boolean) || []
        if (emails.length > 0) {
          await fetch('/api/send-cancellation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emails, eventName: event.name, eventDate: event.event_date }),
          })
        }
      }

      // Delete signups first to avoid foreign key conflict
      await supabase.from('signups').delete().eq('event_id', id)

      // Then delete the event itself
      await supabase.from('events').delete().eq('id', id)
    }
  }

  async function handleDelete(deleteWholeSeries: boolean) {
    setLoading(true)
    if (deleteWholeSeries && seriesId) {
      const { data: seriesEvents } = await supabase.from('events').select('id').eq('series_id', seriesId)
      await notifyAndDelete(seriesEvents?.map((e) => e.id) || [])
    } else {
      await notifyAndDelete([eventId])
    }
    setLoading(false)
    router.refresh()
  }

  function confirmDelete() {
    if (seriesId) {
      const wholeSeries = confirm('This event is part of a recurring series. Click OK to delete the WHOLE series, or Cancel to choose deleting just this one.')
      if (wholeSeries) {
        handleDelete(true)
      } else {
        const justThis = confirm('Delete just this occurrence?')
        if (justThis) handleDelete(false)
      }
    } else {
      const confirmed = confirm('Delete this event? Signed-up volunteers will be notified.')
      if (confirmed) handleDelete(false)
    }
  }

  return (
    <button
      onClick={confirmDelete}
      disabled={loading}
      className="text-sm text-red-600 underline"
    >
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  )
}