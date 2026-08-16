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
      <div className="min-h-screen bg-background transition-colors">
        <main className="px-4 pb-8 pt-16 max-w-2xl w-full mx-auto text-center">
          <p className="text-gray-500 dark:text-gray-400">This event could not be found.</p>
          <Link href="/" className="text-msa-green underline text-sm mt-2 inline-block">
            Back to all events
          </Link>
        </main>
      </div>
    )
  }

  const signedUpCount = event.signups?.length || 0
  const spotsOpen = Math.max(event.v_capacity - signedUpCount, 0)

  return (
    <div className="min-h-screen bg-background transition-colors relative">
      <div className="flex flex-col sm:block items-center gap-3 p-4 sm:p-0">
        <div className="sm:absolute sm:top-6 sm:left-6">
          <ThemeToggle />
        </div>
        <div className="sm:absolute sm:top-6 sm:right-6 w-full sm:w-auto max-w-[280px] sm:max-w-none flex justify-center sm:block">
          <ProfilePill />
        </div>
      </div>

      <main className="px-4 pb-8 pt-2 sm:pt-16 max-w-2xl w-full mx-auto">
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
          <h1 className="text-base font-semibold text-msa-green-dark dark:text-msa-cream">{event.name}</h1>
          {event.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{event.description}</p>
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

          <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2 min-h-[100px]">
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
    </div>
  )
}