import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eventService } from '@/server/services/eventService'
import { UserRole } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as any
    const ownerUserId = searchParams.get('ownerUserId')
    const priority = searchParams.get('priority') as any
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const filters: any = {}
    if (type) filters.type = type
    if (ownerUserId) filters.ownerUserId = ownerUserId
    if (priority) filters.priority = priority
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)

    // If not admin/manager, only show user's events
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.MANAGER) {
      filters.ownerUserId = session.user.id
    }

    const events = await eventService.findMany(filters)
    return NextResponse.json(events)
  } catch (error) {
    console.error('Events GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN and MANAGER can create events
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const event = await eventService.create({
      ...body,
      startAt: new Date(body.startAt),
      endAt: new Date(body.endAt),
      ownerUserId: body.ownerUserId || session.user.id,
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error: any) {
    console.error('Events POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 400 }
    )
  }
}
