import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { emails, eventName, eventDate } = await request.json()

  try {
    await resend.emails.send({
      from: 'MSA Volunteer Portal <onboarding@resend.dev>',
      to: emails,
      subject: `Cancelled: ${eventName}`,
      html: `
        <p>Assalamu alaikum,</p>
        <p><strong>${eventName}</strong> (originally scheduled for ${new Date(eventDate).toLocaleString()}) has been cancelled.</p>
        <p>We're sorry for any inconvenience — JazakAllah Khair for your willingness to volunteer, and we hope to see you at a future event!</p>
      `,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}