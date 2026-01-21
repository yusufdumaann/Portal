import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eventService } from '@/server/services/eventService'
import { UserRole } from '@prisma/client'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = await eventService.findById(params.id)
    if (!event) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check access
    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.MANAGER &&
      event.ownerUserId !== session.user.id &&
      !event.participants.some((p) => p.userId === session.user.id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Event GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = await eventService.findById(params.id)
    if (!event) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check permission
    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.MANAGER &&
      event.ownerUserId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updated = await eventService.update({
      id: params.id,
      ...body,
      startAt: body.startAt ? new Date(body.startAt) : undefined,
      endAt: body.endAt ? new Date(body.endAt) : undefined,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Event PUT error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = await eventService.findById(params.id)
    if (!event) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check permission
    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.MANAGER &&
      event.ownerUserId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await eventService.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Event DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
