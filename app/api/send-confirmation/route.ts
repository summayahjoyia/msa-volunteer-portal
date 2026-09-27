import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { formatEmailDateTime } from '@/lib/formatEventTime'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { email, name, eventName, eventDate, location, groupChatLink, roleName } = await request.json()
  const { dateLine, timeLine } = formatEmailDateTime(eventDate)

  const groupChatHtml = groupChatLink
    ? `<p>Join the volunteer group chat for this event: <a href="${groupChatLink}">${groupChatLink}</a></p>`
    : ''

  const roleHtml = roleName ? `<p>Role: <strong>${roleName}</strong></p>` : ''

  try {
    await resend.emails.send({
      from: 'MSA Volunteer Portal <noreply@msauofa.ca>',
      to: email,
      subject: `You're signed up: ${eventName}`,
      html: `
        <p>Hi ${name},</p>
        <p>You're confirmed for <strong>${eventName}</strong>.</p>
        ${roleHtml}
        <p>
          📅 ${dateLine}<br/>
          🕒 ${timeLine}<br/>
          📍 ${location || 'TBD'}
        </p>
        ${groupChatHtml}
        <p style="color: #D4A537; font-style: italic;">JazakAllah Khair — may Allah reward you for stepping up to serve your community.</p>
        <p>If this wasn't you, please let an MSA exec know right away.</p>
      `,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}