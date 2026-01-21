import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { shiftService } from '@/server/services/shiftService'
import { eventService } from '@/server/services/eventService'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const todayStart = new Date(now.setHours(0, 0, 0, 0))
    const todayEnd = new Date(now.setHours(23, 59, 59, 999))
    const weekLater = new Date(now)
    weekLater.setDate(weekLater.getDate() + 7)

    // Get current shift
    const currentShift = await shiftService.getCurrentShift()

    // Get today's events
    const todayEvents = await eventService.findMany({
      startDate: todayStart,
      endDate: todayEnd,
    })

    // Get upcoming events (next 7 days)
    const upcomingEvents = await eventService.findMany({
      startDate: now,
      endDate: weekLater,
    })

    // Filter events based on user role
    const userEvents = todayEvents.filter(
      (event) =>
        event.ownerUserId === session.user.id ||
        event.participants.some((p) => p.userId === session.user.id)
    )

    const userUpcomingEvents = upcomingEvents.filter(
      (event) =>
        event.ownerUserId === session.user.id ||
        event.participants.some((p) => p.userId === session.user.id)
    )

    return NextResponse.json({
      currentShift: currentShift
        ? {
            id: currentShift.id,
            assignee: currentShift.assignee,
            backup: currentShift.backup,
          }
        : null,
      todayEvents: userEvents,
      upcomingEvents: userUpcomingEvents,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
