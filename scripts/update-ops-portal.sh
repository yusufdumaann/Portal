#!/bin/bash
# Sunucu Tarafında Otomatik Güncelleme ve Başlatma Script'i
# Kullanım: ./update-ops-portal.sh [start|restart|update]

PROJECT_PATH="/var/www/ops-portal"
ACTION="${1:-update}"

echo "🔄 Ops Portal - $ACTION"
echo "📁 Proje yolu: $PROJECT_PATH"
echo ""

cd "$PROJECT_PATH" || exit 1

if [ "$ACTION" = "start" ] || [ "$ACTION" = "restart" ] || [ "$ACTION" = "update" ]; then
  # Git pull (eğer Git kullanılıyorsa)
  if [ -d ".git" ]; then
    echo "📥 Git'ten güncellemeler çekiliyor..."
    git pull || echo "⚠️  Git pull atlandı (opsiyonel)"
  fi

  # Bağımlılıkları yükle
  echo "📦 Bağımlılıklar kontrol ediliyor..."
  npm install --production

  # Prisma client generate
  echo "🔧 Prisma client generate ediliyor..."
  npm run db:generate

  # Migration'ları uygula
  echo "🗄️ Migration'lar kontrol ediliyor..."
  npm run db:migrate:deploy || echo "⚠️  Migration atlandı (opsiyonel)"

  # Build
  echo "🏗️ Production build yapılıyor..."
  npm run build
fi

# PM2 işlemleri
if [ "$ACTION" = "start" ]; then
  echo "🚀 PM2 ile başlatılıyor..."
  NODE_ENV=production pm2 start npm --name "ops-portal" -- start
  pm2 save
  pm2 startup || echo "⚠️  PM2 startup atlandı"
elif [ "$ACTION" = "restart" ]; then
  echo "🔄 PM2 yeniden başlatılıyor..."
  pm2 restart ops-portal || pm2 start npm --name "ops-portal" -- start
  pm2 save
elif [ "$ACTION" = "update" ]; then
  echo "🔄 PM2 yeniden başlatılıyor..."
  pm2 restart ops-portal || pm2 start npm --name "ops-portal" -- start
  pm2 save
fi

echo ""
echo "✅ İşlem tamamlandı!"
echo "📊 PM2 durumu:"
pm2 status ops-portal
echo ""
echo "📋 Logları görüntülemek için: pm2 logs ops-portal"
