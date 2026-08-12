import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { formatEmailDateTime } from '@/lib/formatEventTime'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { emails, eventName, eventDate } = await request.json()
  const { dateLine, timeLine } = formatEmailDateTime(eventDate)

  try {
    await resend.emails.send({
      from: 'MSA Volunteer Portal <noreply@msauofa.ca>',
      to: emails,
      subject: `Cancelled: ${eventName}`,
      html: `
        <p>Assalamu alaikum,</p>
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