import { NextResponse } from 'next/server'
import { addAttendeeToEvent } from '@/lib/googleCalendar'

export async function POST(request: Request) {
  const { calendarEventId, email } = await request.json()

  if (!calendarEventId || !email) {
    return NextResponse.json({ success: false, error: 'Missing calendarEventId or email' }, { status: 400 })
  }

  try {
    await addAttendeeToEvent(calendarEventId, email)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Calendar add-attendee error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}