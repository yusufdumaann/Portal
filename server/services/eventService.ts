import { prisma } from '@/lib/prisma'
import { EventType, Priority, ImpactScope } from '@prisma/client'
import { eventSchema } from '@/lib/validations'

export interface CreateEventInput {
  title: string
  description?: string
  type: EventType
  priority: Priority
  impactScope: ImpactScope
  startAt: Date
  endAt: Date
  ownerUserId: string
  participantIds?: string[]
  tags?: string[]
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string
}

export interface EventFilters {
  type?: EventType
  ownerUserId?: string
  priority?: Priority
  startDate?: Date
  endDate?: Date
}

export class EventService {
  async create(data: CreateEventInput) {
    const validated = eventSchema.parse({
      ...data,
      startAt: data.startAt.toISOString(),
      endAt: data.endAt.toISOString(),
      participantIds: data.participantIds || [],
      tags: data.tags || [],
    })

    // Check for conflicts
    await this.checkConflicts(data.ownerUserId, data.startAt, data.endAt, data.participantIds || [])

    const event = await prisma.calendarEvent.create({
      data: {
        title: validated.title,
        description: validated.description,
        type: validated.type,
        priority: validated.priority,
        impactScope: validated.impactScope,
        startAt: data.startAt,
        endAt: data.endAt,
        ownerUserId: validated.ownerUserId,
        tags: validated.tags,
        participants: {
          create: validated.participantIds.map(userId => ({ userId })),
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    return event
  }

  async update(data: UpdateEventInput) {
    const existing = await prisma.calendarEvent.findUnique({
      where: { id: data.id },
      include: { participants: true },
    })

    if (!existing) {
      throw new Error('Event not found')
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.impactScope !== undefined) updateData.impactScope = data.impactScope
    if (data.startAt !== undefined) updateData.startAt = data.startAt
    if (data.endAt !== undefined) updateData.endAt = data.endAt
    if (data.ownerUserId !== undefined) updateData.ownerUserId = data.ownerUserId
    if (data.tags !== undefined) updateData.tags = data.tags

    // Check conflicts if dates or participants changed
    if (data.startAt || data.endAt || data.participantIds) {
      const startAt = data.startAt || existing.startAt
      const endAt = data.endAt || existing.endAt
      const participantIds = data.participantIds || existing.participants.map(p => p.userId)
      await this.checkConflicts(
        data.ownerUserId || existing.ownerUserId,
        startAt,
        endAt,
        participantIds,
        data.id
      )
    }

    // Update participants if provided
    if (data.participantIds !== undefined) {
      await prisma.eventParticipant.deleteMany({
        where: { eventId: data.id },
      })
      if (data.participantIds.length > 0) {
        await prisma.eventParticipant.createMany({
          data: data.participantIds.map(userId => ({
            eventId: data.id,
            userId,
          })),
        })
      }
    }

    const event = await prisma.calendarEvent.update({
      where: { id: data.id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    return event
  }

  async delete(id: string) {
    await prisma.calendarEvent.delete({
      where: { id },
    })
  }

  async findById(id: string) {
    return prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })
  }

  async findMany(filters?: EventFilters) {
    const where: any = {}

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.ownerUserId) {
      where.ownerUserId = filters.ownerUserId
    }

    if (filters?.priority) {
      where.priority = filters.priority
    }

    if (filters?.startDate || filters?.endDate) {
      where.OR = []
      if (filters.startDate) {
        where.OR.push({
          endAt: { gte: filters.startDate },
        })
      }
      if (filters.endDate) {
        where.OR.push({
          startAt: { lte: filters.endDate },
        })
      }
    }

    return prisma.calendarEvent.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    })
  }

  private async checkConflicts(
    ownerUserId: string,
    startAt: Date,
    endAt: Date,
    participantIds: string[],
    excludeEventId?: string
  ) {
    const allUserIds = [ownerUserId, ...participantIds]

    const conflicts = await prisma.calendarEvent.findMany({
      where: {
        id: excludeEventId ? { not: excludeEventId } : undefined,
        OR: [
          { ownerUserId: { in: allUserIds } },
          {
            participants: {
              some: {
                userId: { in: allUserIds },
              },
            },
          },
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

    if (conflicts.length > 0) {
      throw new Error(
        `Çakışan event bulundu: ${conflicts.map(c => c.title).join(', ')}`
      )
    }
  }
}

export const eventService = new EventService()
