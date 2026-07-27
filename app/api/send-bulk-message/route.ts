import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { emails, subject, message } = await request.json()

  try {
    await resend.emails.send({
      from: 'MSA Volunteer Portal <onboarding@resend.dev>',
      to: emails,
      subject,
      html: `<p>${message.replace(/\n/g, '<br/>')}</p>`,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}