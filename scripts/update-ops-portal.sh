#!/bin/bash
# Sunucu Tarafında Otomatik Güncelleme Script'i
# Kullanım: ./update-ops-portal.sh

PROJECT_PATH="/var/www/ops-portal"

echo "🔄 Ops Portal güncelleniyor..."
echo "📁 Proje yolu: $PROJECT_PATH"
echo ""

cd "$PROJECT_PATH" || exit 1

# Git pull
echo "📥 Git'ten güncellemeler çekiliyor..."
git pull

if [ $? -ne 0 ]; then
  echo "❌ Git pull başarısız!"
  exit 1
fi

# Bağımlılıkları yükle
echo "📦 Bağımlılıklar kontrol ediliyor..."
npm install --production

# Prisma client generate
echo "🔧 Prisma client generate ediliyor..."
npm run db:generate

# Migration'ları uygula
echo "🗄️ Migration'lar kontrol ediliyor..."
npm run db:migrate:deploy

# Build
echo "🏗️ Production build yapılıyor..."
npm run build

# PM2'yi yeniden başlat
echo "🔄 PM2 yeniden başlatılıyor..."
pm2 restart ops-portal

echo ""
echo "✅ Güncelleme tamamlandı!"
echo "📊 PM2 durumu:"
pm2 status ops-portal
