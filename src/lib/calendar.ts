/**
 * Calendar Integration Utilities for Ausaguide
 * Supports 1-click "Add to Google Calendar", Outlook, and .ICS file generation for Apple Calendar / Phone Reminders.
 */

export interface CalendarEventDetails {
  title: string
  description?: string
  location?: string
  startDate: string // YYYY-MM-DD
  startTime?: string // HH:mm or HH:mm:ss
  durationMinutes?: number // Default 60 mins
}

/**
 * Format a Date object into ISO format without dashes/colons for Calendar URLs (YYYYMMDDTHHmmssZ)
 */
function formatCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

function parseEventDates(details: CalendarEventDetails): { start: Date; end: Date } {
  let start: Date
  if (details.startTime) {
    const timeParts = details.startTime.split(":")
    const hours = parseInt(timeParts[0] || "0", 10)
    const minutes = parseInt(timeParts[1] || "0", 10)
    start = new Date(details.startDate)
    start.setHours(hours, minutes, 0, 0)
  } else {
    start = new Date(details.startDate)
    start.setHours(10, 0, 0, 0) // Default 10:00 AM
  }

  const duration = details.durationMinutes || 60
  const end = new Date(start.getTime() + duration * 60 * 1000)

  return { start, end }
}

/**
 * Generates a 1-click Google Calendar web link.
 * Works natively on mobile Android, iOS browsers, and Desktop.
 */
export function getGoogleCalendarUrl(details: CalendarEventDetails): string {
  const { start, end } = parseEventDates(details)
  const startStr = formatCalendarDate(start)
  const endStr = formatCalendarDate(end)

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `🇰🇪 ${details.title} (Ausaguide Tour)`,
    dates: `${startStr}/${endStr}`,
    details: `${details.description || "Your upcoming virtual tour experience with your verified host on Ausaguide."}\n\nJoin link / instructions: ${details.location || window.location.origin}`,
    location: details.location || "Ausaguide Live Video Room",
    sprop: "name:Ausaguide",
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generates and triggers download of an .ICS calendar file for Apple Calendar, Outlook, and mobile calendar apps.
 */
export function downloadIcsFile(details: CalendarEventDetails, filename = "ausaguide-tour.ics") {
  const { start, end } = parseEventDates(details)
  const startStr = formatCalendarDate(start)
  const endStr = formatCalendarDate(end)
  const nowStr = formatCalendarDate(new Date())

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ausaguide//Tour Reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:ag-${Date.now()}@ausaguide.com`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:🇰🇪 ${details.title} - Ausaguide Tour`,
    `DESCRIPTION:${(details.description || "Your upcoming virtual tour with your certified host.").replace(/\n/g, "\\n")}`,
    `LOCATION:${details.location || "Ausaguide Live Video Room"}`,
    "STATUS:CONFIRMED",
    // 15-Minute Reminder Alarm
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: Ausaguide Tour starts in 15 minutes!",
    "END:VALARM",
    // 1-Hour Reminder Alarm
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: Ausaguide Tour starts in 1 hour!",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
