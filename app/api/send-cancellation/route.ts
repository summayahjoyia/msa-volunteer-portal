import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { format } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

function formatEmailDateTime(dateStr: string) {
  const date = new Date(dateStr)
  return {
    dateLine: format(date, 'EEEE, MMMM d, yyyy'),
    timeLine: format(date, 'h:mm a'),
  }
}

export async function POST(request: Request) {
  const { emails, eventName, eventDate } = await request.json()
  const { dateLine, timeLine } = formatEmailDateTime(eventDate)

  try {
    await resend.emails.send({
      from: 'MSA Volunteer Portal <noreply@msauofa.ca>',
      to: emails,
      subject: `Cancelled: ${eventName}`,
      html: `
        <p>Assalam Alaikum,</p>
        <p><strong>${eventName}</strong> has been cancelled. It was originally scheduled for:</p>
        <p>
          📅 ${dateLine}<br/>
          🕒 ${timeLine}
        </p>
        <p>We're sorry for any inconvenience — JazakAllah Khair for your willingness to volunteer, and we hope to see you at a future event!</p>
      `,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}