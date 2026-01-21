import { PrismaClient, UserRole, EventType, Priority, ImpactScope, ShiftType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create users
  const adminPassword = await bcrypt.hash('Admin123!', 10)
  const managerPassword = await bcrypt.hash('Manager123!', 10)
  const memberPassword = await bcrypt.hash('Member123!', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@opsportal.local' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@opsportal.local',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  })

  const manager1 = await prisma.user.upsert({
    where: { email: 'manager1@opsportal.local' },
    update: {},
    create: {
      name: 'Manager One',
      email: 'manager1@opsportal.local',
      passwordHash: managerPassword,
      role: UserRole.MANAGER,
    },
  })

  const manager2 = await prisma.user.upsert({
    where: { email: 'manager2@opsportal.local' },
    update: {},
    create: {
      name: 'Manager Two',
      email: 'manager2@opsportal.local',
      passwordHash: managerPassword,
      role: UserRole.MANAGER,
    },
  })

  const member1 = await prisma.user.upsert({
    where: { email: 'member1@opsportal.local' },
    update: {},
    create: {
      name: 'Member One',
      email: 'member1@opsportal.local',
      passwordHash: memberPassword,
      role: UserRole.MEMBER,
    },
  })

  const member2 = await prisma.user.upsert({
    where: { email: 'member2@opsportal.local' },
    update: {},
    create: {
      name: 'Member Two',
      email: 'member2@opsportal.local',
      passwordHash: memberPassword,
      role: UserRole.MEMBER,
    },
  })

  const member3 = await prisma.user.upsert({
    where: { email: 'member3@opsportal.local' },
    update: {},
    create: {
      name: 'Member Three',
      email: 'member3@opsportal.local',
      passwordHash: memberPassword,
      role: UserRole.MEMBER,
    },
  })

  console.log('✅ Users created')

  // Create events
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const event1 = await prisma.calendarEvent.create({
    data: {
      title: 'Sistem Bakımı',
      description: 'Aylık sistem bakımı ve güncellemeler',
      type: EventType.MAINTENANCE,
      priority: Priority.HIGH,
      impactScope: ImpactScope.CUSTOMER,
      startAt: new Date(tomorrow.getTime()),
      endAt: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // +2 hours
      ownerUserId: admin.id,
      tags: ['maintenance', 'system'],
      participants: {
        create: [
          { userId: manager1.id },
          { userId: member1.id },
        ],
      },
    },
  })

  tomorrow.setHours(10, 0, 0, 0)
  const event2 = await prisma.calendarEvent.create({
    data: {
      title: 'Deployment Toplantısı',
      description: 'Yeni sürüm deployment planlaması',
      type: EventType.MEETING,
      priority: Priority.MED,
      impactScope: ImpactScope.INTERNAL,
      startAt: new Date(tomorrow.getTime()),
      endAt: new Date(tomorrow.getTime() + 90 * 60 * 1000), // +90 minutes
      ownerUserId: manager1.id,
      tags: ['meeting', 'deployment'],
      participants: {
        create: [
          { userId: manager2.id },
          { userId: member2.id },
        ],
      },
    },
  })

  nextWeek.setHours(14, 0, 0, 0)
  const event3 = await prisma.calendarEvent.create({
    data: {
      title: 'Kritik Değişiklik',
      description: 'Veritabanı şema değişikliği',
      type: EventType.CHANGE,
      priority: Priority.HIGH,
      impactScope: ImpactScope.SERVICE,
      startAt: new Date(nextWeek.getTime()),
      endAt: new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000), // +2 hours
      ownerUserId: manager2.id,
      tags: ['change', 'database'],
      participants: {
        create: [
          { userId: admin.id },
          { userId: member3.id },
        ],
      },
    },
  })

  const event4 = await prisma.calendarEvent.create({
    data: {
      title: 'Günlük Görevler',
      description: 'Günlük operasyon görevleri',
      type: EventType.TASK,
      priority: Priority.LOW,
      impactScope: ImpactScope.INTERNAL,
      startAt: new Date(now.getTime()),
      endAt: new Date(now.getTime() + 8 * 60 * 60 * 1000), // +8 hours
      ownerUserId: member1.id,
      tags: ['task', 'daily'],
    },
  })

  nextWeek.setHours(15, 0, 0, 0)
  const event5 = await prisma.calendarEvent.create({
    data: {
      title: 'Haftalık Review',
      description: 'Haftalık operasyon review toplantısı',
      type: EventType.MEETING,
      priority: Priority.MED,
      impactScope: ImpactScope.INTERNAL,
      startAt: new Date(nextWeek.getTime()),
      endAt: new Date(nextWeek.getTime() + 60 * 60 * 1000), // +1 hour
      ownerUserId: manager1.id,
      tags: ['meeting', 'review'],
      participants: {
        create: [
          { userId: admin.id },
          { userId: manager2.id },
          { userId: member1.id },
          { userId: member2.id },
        ],
      },
    },
  })

  console.log('✅ Events created')

  // Create shifts
  const shiftStart1 = new Date(now)
  shiftStart1.setHours(8, 0, 0, 0)
  const shiftEnd1 = new Date(shiftStart1)
  shiftEnd1.setDate(shiftEnd1.getDate() + 1)
  shiftEnd1.setHours(8, 0, 0, 0)

  const shift1 = await prisma.onCallShift.create({
    data: {
      shiftType: ShiftType.DAY,
      startAt: shiftStart1,
      endAt: shiftEnd1,
      assigneeUserId: member1.id,
      backupUserId: member2.id,
      notes: 'Gündüz nöbeti - normal operasyon',
      handoverChecklist: {
        checked: true,
        notes: 'Tüm sistemler normal',
      },
    },
  })

  const shiftStart2 = new Date(now)
  shiftStart2.setDate(shiftStart2.getDate() + 1)
  shiftStart2.setHours(20, 0, 0, 0)
  const shiftEnd2 = new Date(shiftStart2)
  shiftEnd2.setDate(shiftEnd2.getDate() + 1)
  shiftEnd2.setHours(8, 0, 0, 0)

  const shift2 = await prisma.onCallShift.create({
    data: {
      shiftType: ShiftType.NIGHT,
      startAt: shiftStart2,
      endAt: shiftEnd2,
      assigneeUserId: member2.id,
      backupUserId: member3.id,
      notes: 'Gece nöbeti',
    },
  })

  const shiftStart3 = new Date(now)
  shiftStart3.setDate(shiftStart3.getDate() + 5)
  shiftStart3.setHours(8, 0, 0, 0)
  const shiftEnd3 = new Date(shiftStart3)
  shiftEnd3.setDate(shiftEnd3.getDate() + 2)
  shiftEnd3.setHours(20, 0, 0, 0)

  const shift3 = await prisma.onCallShift.create({
    data: {
      shiftType: ShiftType.WEEKEND,
      startAt: shiftStart3,
      endAt: shiftEnd3,
      assigneeUserId: member3.id,
      backupUserId: member1.id,
      notes: 'Hafta sonu nöbeti',
    },
  })

  const shiftStart4 = new Date(now)
  shiftStart4.setDate(shiftStart4.getDate() + 7)
  shiftStart4.setHours(8, 0, 0, 0)
  const shiftEnd4 = new Date(shiftStart4)
  shiftEnd4.setDate(shiftEnd4.getDate() + 1)
  shiftEnd4.setHours(8, 0, 0, 0)

  const shift4 = await prisma.onCallShift.create({
    data: {
      shiftType: ShiftType.DAY,
      startAt: shiftStart4,
      endAt: shiftEnd4,
      assigneeUserId: manager1.id,
      backupUserId: manager2.id,
      notes: 'Yönetici nöbeti',
    },
  })

  const shiftStart5 = new Date(now)
  shiftStart5.setDate(shiftStart5.getDate() + 10)
  shiftStart5.setHours(20, 0, 0, 0)
  const shiftEnd5 = new Date(shiftStart5)
  shiftEnd5.setDate(shiftEnd5.getDate() + 1)
  shiftEnd5.setHours(8, 0, 0, 0)

  const shift5 = await prisma.onCallShift.create({
    data: {
      shiftType: ShiftType.NIGHT,
      startAt: shiftStart5,
      endAt: shiftEnd5,
      assigneeUserId: member1.id,
      notes: 'Gece nöbeti - yedek yok',
    },
  })

  console.log('✅ Shifts created')

  console.log('🎉 Seeding completed!')
  console.log('\n📝 Sample users:')
  console.log('  Admin: admin@opsportal.local / Admin123!')
  console.log('  Manager: manager1@opsportal.local / Manager123!')
  console.log('  Member: member1@opsportal.local / Member123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
