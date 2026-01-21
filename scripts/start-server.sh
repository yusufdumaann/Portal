#!/bin/bash
# Sunucu Başlatma Script'i
# Kullanım: ./start-server.sh

PROJECT_PATH="/var/www/ops-portal"

echo "🚀 Ops Portal sunucusu başlatılıyor..."
echo "📁 Proje yolu: $PROJECT_PATH"
echo ""

cd "$PROJECT_PATH" || exit 1

# .env dosyası kontrolü
if [ ! -f ".env" ]; then
  echo "❌ .env dosyası bulunamadı!"
  echo "   Lütfen .env dosyasını oluşturun:"
  echo "   nano .env"
  exit 1
fi

# PostgreSQL kontrolü
echo "🗄️  PostgreSQL kontrol ediliyor..."
if ! sudo systemctl is-active --quiet postgresql; then
  echo "⚠️  PostgreSQL çalışmıyor, başlatılıyor..."
  sudo systemctl start postgresql
fi

# Bağımlılıkları yükle
echo "📦 Bağımlılıklar kontrol ediliyor..."
if [ ! -d "node_modules" ]; then
  npm install --production
fi

# Prisma client generate
echo "🔧 Prisma client generate ediliyor..."
npm run db:generate

# Migration'ları uygula
echo "🗄️  Migration'lar kontrol ediliyor..."
npm run db:migrate:deploy || echo "⚠️  Migration atlandı"

# Build
echo "🏗️  Production build yapılıyor..."
if [ ! -d ".next" ]; then
  npm run build
fi

# PM2 kontrolü
if ! command -v pm2 &> /dev/null; then
  echo "📦 PM2 kuruluyor..."
  sudo npm install -g pm2
fi

# PM2 ile başlat
echo "🚀 PM2 ile başlatılıyor..."

# Eğer zaten çalışıyorsa durdur
pm2 delete ops-portal 2>/dev/null || true

# Yeni instance başlat
NODE_ENV=production pm2 start npm --name "ops-portal" -- start

# PM2'yi kaydet
pm2 save

# Startup script (opsiyonel)
echo ""
echo "💡 PM2'yi sistem başlangıcında otomatik başlatmak için:"
echo "   pm2 startup"
echo "   (Çıktıdaki komutu çalıştırın)"

echo ""
echo "✅ Sunucu başlatıldı!"
echo ""
echo "📊 PM2 durumu:"
pm2 status ops-portal
echo ""
echo "📋 Logları görüntülemek için: pm2 logs ops-portal"
echo "🌐 Uygulama: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
