import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eventService } from '@/server/services/eventService'
import { format } from 'date-fns'

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function formatIcsDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss")
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const events = await eventService.findMany()
    const userEvents = events.filter(
      (event) =>
        event.ownerUserId === session.user.id ||
        event.participants.some((p) => p.userId === session.user.id)
    )

    let icsContent = 'BEGIN:VCALENDAR\r\n'
    icsContent += 'VERSION:2.0\r\n'
    icsContent += 'PRODID:-//Ops Portal//Calendar//EN\r\n'
    icsContent += 'CALSCALE:GREGORIAN\r\n'
    icsContent += 'METHOD:PUBLISH\r\n'

    for (const event of userEvents) {
      icsContent += 'BEGIN:VEVENT\r\n'
      icsContent += `UID:${event.id}@ops-portal\r\n`
      icsContent += `DTSTART:${formatIcsDate(event.startAt)}\r\n`
      icsContent += `DTEND:${formatIcsDate(event.endAt)}\r\n`
      icsContent += `SUMMARY:${escapeIcsText(event.title)}\r\n`
      if (event.description) {
        icsContent += `DESCRIPTION:${escapeIcsText(event.description)}\r\n`
      }
      icsContent += `STATUS:CONFIRMED\r\n`
      icsContent += `SEQUENCE:0\r\n`
      icsContent += 'END:VEVENT\r\n'
    }

    icsContent += 'END:VCALENDAR\r\n'

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="ops-portal-calendar.ics"',
      },
    })
  } catch (error) {
    console.error('ICS export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
