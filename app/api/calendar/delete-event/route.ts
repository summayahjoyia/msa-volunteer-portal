import { NextResponse } from 'next/server'
import { deleteCalendarEvent } from '@/lib/googleCalendar'

export async function POST(request: Request) {
  const { calendarEventId } = await request.json()

  if (!calendarEventId) {
    return NextResponse.json({ success: false, error: 'Missing calendarEventId' }, { status: 400 })
  }

  try {
    await deleteCalendarEvent(calendarEventId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Calendar delete error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}