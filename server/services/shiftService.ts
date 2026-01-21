import { prisma } from '@/lib/prisma'
import { ShiftType } from '@prisma/client'
import { shiftSchema } from '@/lib/validations'

export interface CreateShiftInput {
  shiftType: ShiftType
  startAt: Date
  endAt: Date
  assigneeUserId: string
  backupUserId?: string
  notes?: string
  handoverChecklist?: Record<string, any>
}

export interface UpdateShiftInput extends Partial<CreateShiftInput> {
  id: string
}

export interface ShiftStats {
  userId: string
  userName: string
  shiftCount: number
}

export class ShiftService {
  async create(data: CreateShiftInput) {
    const validated = shiftSchema.parse({
      ...data,
      startAt: data.startAt.toISOString(),
      endAt: data.endAt.toISOString(),
    })

    // Check for overlaps
    await this.checkOverlaps(data.assigneeUserId, data.startAt, data.endAt)

    if (data.backupUserId) {
      await this.checkOverlaps(data.backupUserId, data.startAt, data.endAt)
    }

    const shift = await prisma.onCallShift.create({
      data: {
        shiftType: validated.shiftType,
        startAt: data.startAt,
        endAt: data.endAt,
        assigneeUserId: validated.assigneeUserId,
        backupUserId: validated.backupUserId,
        notes: validated.notes,
        handoverChecklist: validated.handoverChecklist || {},
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        backup: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return shift
  }

  async update(data: UpdateShiftInput) {
    const existing = await prisma.onCallShift.findUnique({
      where: { id: data.id },
    })

    if (!existing) {
      throw new Error('Shift not found')
    }

    const updateData: any = {}
    if (data.shiftType !== undefined) updateData.shiftType = data.shiftType
    if (data.startAt !== undefined) updateData.startAt = data.startAt
    if (data.endAt !== undefined) updateData.endAt = data.endAt
    if (data.assigneeUserId !== undefined) updateData.assigneeUserId = data.assigneeUserId
    if (data.backupUserId !== undefined) updateData.backupUserId = data.backupUserId
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.handoverChecklist !== undefined) updateData.handoverChecklist = data.handoverChecklist

    // Check overlaps if dates or assignee changed
    if (data.startAt || data.endAt || data.assigneeUserId) {
      const startAt = data.startAt || existing.startAt
      const endAt = data.endAt || existing.endAt
      const assigneeUserId = data.assigneeUserId || existing.assigneeUserId
      await this.checkOverlaps(assigneeUserId, startAt, endAt, data.id)
    }

    if (data.backupUserId && (data.startAt || data.endAt)) {
      const startAt = data.startAt || existing.startAt
      const endAt = data.endAt || existing.endAt
      await this.checkOverlaps(data.backupUserId, startAt, endAt, data.id)
    }

    const shift = await prisma.onCallShift.update({
      where: { id: data.id },
      data: updateData,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        backup: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return shift
  }

  async delete(id: string) {
    await prisma.onCallShift.delete({
      where: { id },
    })
  }

  async findById(id: string) {
    return prisma.onCallShift.findUnique({
      where: { id },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        backup: {
          select: { id: true, name: true, email: true },
        },
      },
    })
  }

  async findMany(startDate?: Date, endDate?: Date) {
    const where: any = {}

    if (startDate || endDate) {
      where.OR = []
      if (startDate) {
        where.OR.push({
          endAt: { gte: startDate },
        })
      }
      if (endDate) {
        where.OR.push({
          startAt: { lte: endDate },
        })
      }
    }

    return prisma.onCallShift.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        backup: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    })
  }

  async getCurrentShift() {
    const now = new Date()
    return prisma.onCallShift.findFirst({
      where: {
        startAt: { lte: now },
        endAt: { gte: now },
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        backup: {
          select: { id: true, name: true, email: true },
        },
      },
    })
  }

  async getStats(days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const shifts = await prisma.onCallShift.findMany({
      where: {
        startAt: { gte: startDate },
      },
      include: {
        assignee: {
          select: { id: true, name: true },
        },
      },
    })

    const statsMap = new Map<string, ShiftStats>()

    for (const shift of shifts) {
      const userId = shift.assigneeUserId
      const existing = statsMap.get(userId)

      if (existing) {
        existing.shiftCount++
      } else {
        statsMap.set(userId, {
          userId,
          userName: shift.assignee?.name || 'Unknown',
          shiftCount: 1,
        })
      }
    }

    return Array.from(statsMap.values()).sort((a, b) => b.shiftCount - a.shiftCount)
  }

  private async checkOverlaps(
    userId: string,
    startAt: Date,
    endAt: Date,
    excludeShiftId?: string
  ) {
    const overlaps = await prisma.onCallShift.findMany({
      where: {
        id: excludeShiftId ? { not: excludeShiftId } : undefined,
        OR: [
          { assigneeUserId: userId },
          { backupUserId: userId },
        ],
        AND: [
          {
            startAt: { lt: endAt },
          },
          {
            endAt: { gt: startAt },
          },
        ],
      },
    })

    if (overlaps.length > 0) {
      throw new Error(
        `Kullanıcı bu saat diliminde zaten nöbetçi: ${overlaps.map(o => o.id).join(', ')}`
      )
    }
  }
}

export const shiftService = new ShiftService()
