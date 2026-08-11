import { NextResponse } from 'next/server'
import { updateCalendarEvent } from '@/lib/googleCalendar'

export async function POST(request: Request) {
  const { calendarEventId, summary, description, location, startDateTime, endDateTime } =
    await request.json()

  if (!calendarEventId) {
    return NextResponse.json({ success: false, error: 'Missing calendarEventId' }, { status: 400 })
  }

  try {
    await updateCalendarEvent(calendarEventId, {
      summary,
      description,
      location,
      startDateTime,
      endDateTime,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Calendar update error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}