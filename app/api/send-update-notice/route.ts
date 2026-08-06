import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { emails, eventName, eventDate, location, description } = await request.json()

  try {
    await resend.emails.send({
      from: 'MSA Volunteer Portal <noreply@msauofa.ca>',
      to: emails,
      subject: `Updated: ${eventName}`,
      html: `
        <p>Assalam Alaikum,</p>
        <p><strong>${eventName}</strong> has been updated. Here are the current details:</p>
        <p>📅 ${new Date(eventDate).toLocaleString()}<br/>📍 ${location || 'TBD'}</p>
        <p>${description}</p>
        <p>Please review the changes — JazakAllah Khair for volunteering!</p>
      `,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}