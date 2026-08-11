import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://volunteer.msauofa.ca/api/calendar/callback'
  )

  await oauth2Client.getToken(code!)

  return NextResponse.json({ success: true })
}