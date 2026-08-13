import { supabase } from '@/lib/supabase'
import ProfilePill from '../../components/ProfilePill'
import EventSignUpButton from '../../components/EventSignUpButton'
import ThemeToggle from '../../components/ThemeToggle'
import Link from 'next/link'
import { formatEventDate, formatEventTime } from '@/lib/formatEventTime'
import { Calendar, MapPin, ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: event, error } = await supabase
    .from('events')
    .select('*, signups(id)')
    .eq('id', id)
    .single()

  if (error || !event) {
    return (
      <main className="p-8 max-w-2xl mx-auto min-h-screen bg-background transition-colors text-center">
        <p className="text-gray-500 dark:text-gray-400">This event could not be found.</p>
        <Link href="/" className="text-msa-green underline text-sm mt-2 inline-block">
          Back to all events
        </Link>
      </main>
    )
  }

  const signedUpCount = event.signups?.length || 0
  const spotsOpen = Math.max(event.v_capacity - signedUpCount, 0)

  return (
    <main className="p-8 max-w-2xl mx-auto min-h-screen bg-background transition-colors">
      <div className="mb-6 flex items-center gap-3">
        <ThemeToggle />
        <div className="flex-1 flex justify-end">
          <ProfilePill />
        </div>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-msa-green-dark dark:hover:text-msa-cream transition mb-6"
      >
        <ChevronLeft size={16} />
        All Events
      </Link>

      <div className="text-center mb-8">
        <p className="text-msa-gold text-base sm:text-lg tracking-wide mb-2" style={{ fontFamily: 'serif' }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
      </div>

      <div className="bg-white dark:bg-[#2A2A2D] rounded-xl p-4 shadow-sm border-t-4 border-msa-gold transition-colors">
        <h1 className="text-lg font-bold text-msa-green-dark dark:text-msa-cream">{event.name}</h1>
        {event.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
        )}

        <div className="mt-2 space-y-0.5 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-start gap-1.5">
            <Calendar size={13} className="mt-0.5 shrink-0" />
            <div>
              <div>{formatEventDate(event.event_date)}</div>
              <div>{formatEventTime(event.event_date, event.event_end_date)}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={13} />
            <span>{event.location || 'Location TBD'}</span>
          </div>
          <p>Spots open: {spotsOpen} of {event.v_capacity}</p>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
          <EventSignUpButton
            eventId={event.id}
            eventName={event.name}
            eventDate={event.event_date}
            location={event.location}
            spotsOpen={spotsOpen}
          />
        </div>
      </div>
    </main>
  )
}