import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { email, name, eventName, eventDate, location } = await request.json()

  try {
    await resend.emails.send({
      from: 'MSA Volunteer Portal <onboarding@resend.dev>',
      to: email,
      subject: `You're signed up: ${eventName}`,
      html: `
        <p>Hi ${name},</p>
        <p>You're confirmed for <strong>${eventName}</strong>.</p>
        <p>📅 ${new Date(eventDate).toLocaleString()}<br/>📍 ${location || 'TBD'}</p>
        <p style="color: #D4A537; font-style: italic;">JazakAllah Khair — may Allah reward you for stepping up to serve your community.</p>
        <p>If this wasn't you, please let an MSA exec know right away.</p>
      `,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}