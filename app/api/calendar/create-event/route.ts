import { NextResponse } from 'next/server'
import { createCalendarEvent } from '@/lib/googleCalendar'

export async function POST(request: Request) {
  const { summary, description, location, startDateTime, endDateTime, attendeeEmails } =
    await request.json()

  try {
    const calendarEventId = await createCalendarEvent({
      summary,
      description,
      location,
      startDateTime,
      endDateTime,
      attendeeEmails,
    })
    return NextResponse.json({ success: true, calendarEventId })
  } catch (error) {
    console.error('Calendar create error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}