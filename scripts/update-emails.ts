import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Email adreslerini güncelleniyor...')

  const updates = [
    { old: 'admin@local', new: 'admin@opsportal.local' },
    { old: 'manager1@local', new: 'manager1@opsportal.local' },
    { old: 'manager2@local', new: 'manager2@opsportal.local' },
    { old: 'member1@local', new: 'member1@opsportal.local' },
    { old: 'member2@local', new: 'member2@opsportal.local' },
    { old: 'member3@local', new: 'member3@opsportal.local' },
  ]

  for (const update of updates) {
    try {
      const result = await prisma.user.updateMany({
        where: { email: update.old },
        data: { email: update.new },
      })
      
      if (result.count > 0) {
        console.log(`✅ ${update.old} → ${update.new} (${result.count} kullanıcı)`)
      } else {
        console.log(`ℹ️  ${update.old} bulunamadı (zaten güncellenmiş olabilir)`)
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⚠️  ${update.new} zaten mevcut, ${update.old} atlanıyor`)
      } else {
        console.error(`❌ ${update.old} güncellenirken hata:`, error.message)
      }
    }
  }

  console.log('\n🎉 Email güncelleme tamamlandı!')
}

main()
  .catch((e) => {
    console.error('Hata:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
