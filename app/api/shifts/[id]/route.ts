import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { shiftService } from '@/server/services/shiftService'
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

    const shift = await shiftService.findById(params.id)
    if (!shift) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check access
    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.MANAGER &&
      shift.assigneeUserId !== session.user.id &&
      shift.backupUserId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(shift)
  } catch (error) {
    console.error('Shift GET error:', error)
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

    const shift = await shiftService.findById(params.id)
    if (!shift) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Only ADMIN and MANAGER can update shifts
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updated = await shiftService.update({
      id: params.id,
      ...body,
      startAt: body.startAt ? new Date(body.startAt) : undefined,
      endAt: body.endAt ? new Date(body.endAt) : undefined,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Shift PUT error:', error)
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

    const shift = await shiftService.findById(params.id)
    if (!shift) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Only ADMIN and MANAGER can delete shifts
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await shiftService.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Shift DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
