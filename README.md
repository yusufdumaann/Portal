# Ops Portal

Modern, estetik ve üretim kalitesine yakın bir TechOps ekibi yönetim portalı.

## 🚀 Hızlı Başlangıç

### Ubuntu Sunucusunda Kurulum

**Sıfırdan kurulum için detaylı rehber:**
👉 **[UBUNTU_FULL_SETUP.md](./UBUNTU_FULL_SETUP.md)** - Tüm adımları içeren kapsamlı kurulum rehberi

### Hızlı Komutlar

```bash
# Sunucuda projeyi başlat
cd /var/www/ops-portal
chmod +x scripts/start-server.sh
./scripts/start-server.sh

# Veya npm script ile
npm run server:start
```

## 📚 Dokümantasyon

- **[UBUNTU_FULL_SETUP.md](./UBUNTU_FULL_SETUP.md)** - Ubuntu sunucusunda sıfırdan kurulum rehberi
- **[SYNC_GUIDE.md](./SYNC_GUIDE.md)** - Yerel ve sunucu arasında senkronizasyon rehberi
- **[SERVER_START.md](./SERVER_START.md)** - Sunucu başlatma rehberi
- **[UPDATE_EMAILS.md](./UPDATE_EMAILS.md)** - Email güncelleme rehberi

## ✨ Özellikler

- 🔐 **Kimlik Doğrulama & RBAC**: NextAuth.js ile güvenli giriş ve rol tabanlı yetkilendirme
- 📅 **Operasyon Takvimi**: Event yönetimi, filtreleme, çakışma kontrolü
- 📞 **Nöbet Planlama**: Shift yönetimi, istatistikler, handover notları
- 📊 **Dashboard**: Bugünün özeti, yaklaşan eventler, hızlı aksiyonlar
- 👥 **Kullanıcı Yönetimi**: Admin paneli ile kullanıcı ve rol yönetimi
- 🎨 **Modern UI**: shadcn/ui bileşenleri, dark/light mode, responsive tasarım

## 🛠️ Teknolojiler

- **Frontend**: Next.js 14+ (App Router) + TypeScript
- **UI**: TailwindCSS + shadcn/ui + Lucide Icons
- **State**: React Query (TanStack Query) + Zod validation
- **Auth**: NextAuth.js (Credentials)
- **Backend**: Next.js Route Handlers + Prisma
- **Database**: PostgreSQL
- **Deployment**: Normal hosting (VPS, PaaS, vb.)

## 📋 Gereksinimler

- Node.js 20+ (LTS önerilir) veya 22+
- PostgreSQL 12+
- Ubuntu 20.04+ (production için)

## 🔑 İlk Giriş Bilgileri

Seed script çalıştırıldıktan sonra:

- **Admin**: `admin@opsportal.local` / `Admin123!`
- **Manager**: `manager1@opsportal.local` / `Manager123!`
- **Member**: `member1@opsportal.local` / `Member123!`

**⚠️ Production'da bu kullanıcıları değiştirmeyi unutmayın!**

## 📖 Kullanım

### Roller ve Yetkiler

- **ADMIN**: Tüm yönetim yetkileri + kullanıcı/rol atama
- **MANAGER**: Takvim ve nöbet planı yönetimi
- **MEMBER**: Kendi eventlerini görüntüleme, nöbet bilgilerini görüntüleme

### Sayfalar

- `/` - Dashboard: Bugünün özeti, yaklaşan eventler
- `/calendar` - Takvim: Aylık/haftalık/agenda görünümü, event yönetimi
- `/oncall` - Nöbet: Shift planlama, istatistikler, aktif nöbet bilgisi
- `/users` - Kullanıcılar: Kullanıcı yönetimi (sadece ADMIN)
- `/settings` - Ayarlar: Profil bilgileri, tema tercihi

## 🔧 Geliştirme

### Yerel Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# .env dosyası oluştur
cp .env.example .env

# Veritabanı migration
npm run db:migrate

# Seed data
npm run db:seed

# Development server
npm run dev
```

### Production Build

```bash
npm install --production
npm run db:generate
npm run db:migrate:deploy
npm run build
npm start
```

## 📝 Script'ler

```bash
# Veritabanı
npm run db:generate        # Prisma client generate
npm run db:migrate         # Development migration
npm run db:migrate:deploy  # Production migration
npm run db:seed            # Seed data
npm run db:update-emails   # Email güncelleme

# Sunucu
npm run server:start       # Sunucuyu başlat
npm run server:restart     # Sunucuyu yeniden başlat
npm run server:update      # Güncelle ve yeniden başlat
```

## 🔒 Güvenlik

- ✅ Environment variables asla commit edilmez
- ✅ Password hashing (bcrypt)
- ✅ JWT session management
- ✅ Role-based access control
- ✅ SQL injection koruması (Prisma)
- ⚠️ Production'da HTTPS kullanın
- ⚠️ Güçlü `NEXTAUTH_SECRET` kullanın
- ⚠️ Database şifrelerini güçlü tutun

## 📄 Lisans

MIT
