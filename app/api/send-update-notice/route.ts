import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { format } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

const HIGHLIGHT_STYLE =
  'background-color: #FEF3C7; padding: 2px 6px; border-radius: 4px; font-weight: 600;'

function formatEmailDateTime(dateStr: string) {
  const date = new Date(dateStr)
  return {
    dateLine: format(date, 'EEEE, MMMM d, yyyy'),
    timeLine: format(date, 'h:mm a'),
  }
}

export async function POST(request: Request) {
  const { emails, eventName, eventDate, location, description, changedFields = [] } =
    await request.json()

  const changed = new Set(changedFields as string[])
  const { dateLine, timeLine } = formatEmailDateTime(eventDate)

  const dateHtml = changed.has('date') ? `<span style="${HIGHLIGHT_STYLE}">${dateLine}</span>` : dateLine
  const timeHtml = changed.has('date') ? `<span style="${HIGHLIGHT_STYLE}">${timeLine}</span>` : timeLine

  const locationText = location || 'TBD'
  const locationHtml = changed.has('location')
    ? `<span style="${HIGHLIGHT_STYLE}">${locationText}</span>`
    : locationText

  const descriptionHtml = changed.has('description')
    ? `<span style="${HIGHLIGHT_STYLE}">${description}</span>`
    : description

  try {
    await resend.emails.send({
      from: 'MSA Volunteer Portal <noreply@msauofa.ca>',
      to: emails,
      subject: `Updated: ${eventName}`,
      html: `
        <p>Assalam Alaikum,</p>
        <p><strong>${eventName}</strong> has been updated. Here are the current details:</p>
        <p>
          📅 ${dateHtml}<br/>
          🕒 ${timeHtml}<br/>
          📍 ${locationHtml}
        </p>
        <p>${descriptionHtml}</p>
        <p>Please review the changes — JazakAllah Khair for volunteering!</p>
      `,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}