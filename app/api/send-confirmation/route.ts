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
  const { email, name, eventName, eventDate, location } = await request.json()
  const { dateLine, timeLine } = formatEmailDateTime(eventDate)

  try {
    await resend.emails.send({
      from: 'MSA Volunteer Portal <noreply@msauofa.ca>',
      to: email,
      subject: `You're signed up: ${eventName}`,
      html: `
        <p>Hi ${name},</p>
        <p>You're confirmed for <strong>${eventName}</strong>.</p>
        <p>
          📅 ${dateLine}<br/>
          🕒 ${timeLine}<br/>
          📍 ${location || 'TBD'}
        </p>
        <p style="color: #D4A537; font-style: italic;">JazakAllah Khair — may Allah reward you for stepping up to serve your community.</p>
      `,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}