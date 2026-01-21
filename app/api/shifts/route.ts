import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { shiftService } from '@/server/services/shiftService'
import { UserRole } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const shifts = await shiftService.findMany(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )

    // Filter by user if not admin/manager
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.MANAGER) {
      const userShifts = shifts.filter(
        (shift) =>
          shift.assigneeUserId === session.user.id ||
          shift.backupUserId === session.user.id
      )
      return NextResponse.json(userShifts)
    }

    return NextResponse.json(shifts)
  } catch (error) {
    console.error('Shifts GET error:', error)
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

    // Only ADMIN and MANAGER can create shifts
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const shift = await shiftService.create({
      ...body,
      startAt: new Date(body.startAt),
      endAt: new Date(body.endAt),
    })

    return NextResponse.json(shift, { status: 201 })
  } catch (error: any) {
    console.error('Shifts POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 400 }
    )
  }
}
