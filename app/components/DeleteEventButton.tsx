'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

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

      await supabase.from('signups').delete().eq('event_id', id)
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
      className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-600/10 transition disabled:opacity-50"
      aria-label="Delete event"
    >
      <Trash2 size={16} />
    </button>
  )
}