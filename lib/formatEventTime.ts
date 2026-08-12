const TIMEZONE = 'America/Edmonton'

export function formatEventDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: TIMEZONE,
  })
}

export function formatEventDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: TIMEZONE,
  })
}

export function formatEventTimeOnly(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TIMEZONE,
  })
}

export function formatEventTime(start: string, end: string | null) {
  const startStr = formatEventTimeOnly(start)
  if (!end) return startStr
  const endStr = formatEventTimeOnly(end)
  return `${startStr} – ${endStr}`
}

export function formatEmailDateTime(dateStr: string) {
  return {
    dateLine: new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: TIMEZONE,
    }),
    timeLine: formatEventTimeOnly(dateStr),
  }
}