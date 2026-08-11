import { google } from 'googleapis'

function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
  })

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function createCalendarEvent({
  summary,
  description,
  location,
  startDateTime,
  endDateTime,
  attendeeEmails = [],
}: {
  summary: string
  description?: string
  location?: string
  startDateTime: string
  endDateTime: string
  attendeeEmails?: string[]
}) {
  const calendar = getCalendarClient()

  const res = await calendar.events.insert({
    calendarId: 'primary',
    sendUpdates: 'all',
    requestBody: {
      summary,
      description,
      location,
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
      attendees: attendeeEmails.map((email) => ({ email })),
    },
  })

  return res.data.id
}

export async function updateCalendarEvent(
  calendarEventId: string,
  {
    summary,
    description,
    location,
    startDateTime,
    endDateTime,
    attendeeEmails,
  }: {
    summary?: string
    description?: string
    location?: string
    startDateTime?: string
    endDateTime?: string
    attendeeEmails?: string[]
  }
) {
  const calendar = getCalendarClient()

  const updateBody: Record<string, any> = {}
  if (summary !== undefined) updateBody.summary = summary
  if (description !== undefined) updateBody.description = description
  if (location !== undefined) updateBody.location = location
  if (startDateTime !== undefined) updateBody.start = { dateTime: startDateTime }
  if (endDateTime !== undefined) updateBody.end = { dateTime: endDateTime }
  if (attendeeEmails !== undefined) {
    updateBody.attendees = attendeeEmails.map((email) => ({ email }))
  }

  await calendar.events.patch({
    calendarId: 'primary',
    eventId: calendarEventId,
    sendUpdates: 'all',
    requestBody: updateBody,
  })
}

export async function deleteCalendarEvent(calendarEventId: string) {
  const calendar = getCalendarClient()
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: calendarEventId,
      sendUpdates: 'all',
    })
  } catch (error: any) {
    if (error?.code !== 410 && error?.code !== 404) {
      throw error
    }
  }
}