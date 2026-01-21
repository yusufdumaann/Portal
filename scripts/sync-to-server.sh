#!/bin/bash
# Yerel ve Sunucu Arasında Senkronizasyon Script'i
# Kullanım: ./sync-to-server.sh

# ============================================
# AYARLAR - Bu değerleri kendi bilgilerinize göre düzenleyin
# ============================================
SERVER_USER="user"                    # Sunucu kullanıcı adı
SERVER_IP="your-server-ip"            # Sunucu IP adresi veya domain
SERVER_PATH="/var/www/ops-portal"     # Sunucudaki proje yolu
LOCAL_PATH="."                        # Yerel proje yolu (script'in bulunduğu klasör)

# ============================================
# SCRIPT
# ============================================

echo "🔄 Sunucuya senkronizasyon başlatılıyor..."
echo "📡 Sunucu: $SERVER_USER@$SERVER_IP:$SERVER_PATH"
echo ""

# rsync ile senkronizasyon
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude 'Thumbs.db' \
  -e ssh \
  "$LOCAL_PATH/" \
  "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Senkronizasyon tamamlandı!"
  echo ""
  echo "📋 Sunucuda şu komutları çalıştırın:"
  echo "   cd $SERVER_PATH"
  echo "   npm install --production"
  echo "   npm run db:generate"
  echo "   npm run db:migrate:deploy"
  echo "   npm run build"
  echo "   pm2 restart ops-portal"
  echo ""
  echo "🚀 Veya sunucuda 'update-ops-portal.sh' script'ini çalıştırın"
else
  echo ""
  echo "❌ Senkronizasyon başarısız!"
  echo "   SSH bağlantısını ve sunucu bilgilerini kontrol edin"
  exit 1
fi
