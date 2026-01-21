# Hızlı Başlangıç

## Development

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. .env dosyası oluştur
cat > .env << EOF
DATABASE_URL="postgresql://opsportal:opsportal123@localhost:5432/opsportal?schema=public"
NEXTAUTH_SECRET="dev-secret-key-min-32-chars-123456789012"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
EOF

# 3. PostgreSQL'i başlat ve veritabanını oluştur
# PostgreSQL kurulu ve çalışıyor olmalı
createdb opsportal
# veya psql ile:
# psql -U postgres
# CREATE DATABASE opsportal;

# 4. Veritabanını hazırla
npm run db:migrate
npm run db:seed

# 5. Development server'ı başlat
npm run dev
```

Tarayıcıda: http://localhost:3000

**Giriş**: `admin@opsportal.local` / `Admin123!`

## Production

```bash
# 1. Bağımlılıkları yükle
npm install --production

# 2. .env dosyasını production için ayarla
# DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL güncelle

# 3. Prisma client generate
npm run db:generate

# 4. Migration'ları uygula
npm run db:migrate:deploy

# 5. Build
npm run build

# 6. PM2 ile başlat
pm2 start npm --name "ops-portal" -- start
pm2 save
pm2 startup
```

Detaylı bilgi için:
- **SETUP.md** - Detaylı kurulum rehberi
- **DEPLOYMENT.md** - Production deployment rehberi
- **README.md** - Genel bilgiler
