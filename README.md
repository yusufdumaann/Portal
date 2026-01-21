# Ops Portal

Modern, estetik ve üretim kalitesine yakın bir TechOps ekibi yönetim portalı.

## Özellikler

- 🔐 **Kimlik Doğrulama & RBAC**: NextAuth.js ile güvenli giriş ve rol tabanlı yetkilendirme
- 📅 **Operasyon Takvimi**: Event yönetimi, filtreleme, çakışma kontrolü
- 📞 **Nöbet Planlama**: Shift yönetimi, istatistikler, handover notları
- 📊 **Dashboard**: Bugünün özeti, yaklaşan eventler, hızlı aksiyonlar
- 👥 **Kullanıcı Yönetimi**: Admin paneli ile kullanıcı ve rol yönetimi
- 🎨 **Modern UI**: shadcn/ui bileşenleri, dark/light mode, responsive tasarım

## Teknolojiler

- **Frontend**: Next.js 14+ (App Router) + TypeScript
- **UI**: TailwindCSS + shadcn/ui + Lucide Icons
- **State**: React Query (TanStack Query) + Zod validation
- **Auth**: NextAuth.js (Credentials)
- **Backend**: Next.js Route Handlers + Prisma
- **Database**: PostgreSQL
- **Deployment**: Normal hosting (VPS, PaaS, vb.)

## Gereksinimler

- Node.js 18+
- PostgreSQL 12+ (yerel veya bulut)

## Hızlı Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Environment Değişkenlerini Ayarlayın

`.env` dosyası oluşturun:

```env
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/opsportal?schema=public"
NEXTAUTH_SECRET="your-secret-key-change-in-production-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Veritabanını Hazırlayın

#### Yerel PostgreSQL

```bash
# PostgreSQL'de veritabanı oluşturun
createdb opsportal

# Migration'ları çalıştırın
npm run db:migrate

# Seed data (örnek kullanıcılar)
npm run db:seed
```


### 4. Development Server'ı Başlatın

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## Production Deployment

### Build ve Başlatma

```bash
# Prisma client generate
npm run db:generate

# Production build
npm run build

# Start
npm start
```

### PM2 ile Çalıştırma (Önerilen)

```bash
npm install -g pm2
pm2 start npm --name "ops-portal" -- start
pm2 startup
pm2 save
```

### Hosting Seçenekleri

- **VPS**: DigitalOcean, Linode, AWS EC2, vb.
- **PaaS**: Vercel, Railway, Render, Heroku
- **Cloud**: AWS, Google Cloud, Azure

Detaylı deployment bilgileri için `SETUP.md` dosyasına bakın.

## Kullanım

### Giriş Bilgileri

Seed script çalıştırıldıktan sonra:

- **Admin**: `admin@opsportal.local` / `Admin123!`
- **Manager**: `manager1@opsportal.local` / `Manager123!`
- **Member**: `member1@opsportal.local` / `Member123!`

**Production'da bu kullanıcıları değiştirmeyi unutmayın!**

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

## API Endpoints

- `POST /api/auth/[...nextauth]` - Giriş (NextAuth)
- `GET/POST /api/events` - Event listesi/oluşturma
- `GET/PUT/DELETE /api/events/:id` - Event işlemleri
- `GET/POST /api/shifts` - Shift listesi/oluşturma
- `GET/PUT/DELETE /api/shifts/:id` - Shift işlemleri
- `GET /api/shifts/stats` - Nöbet istatistikleri
- `GET/POST /api/users` - Kullanıcı listesi/oluşturma (ADMIN)
- `PUT /api/users/:id/role` - Rol güncelleme (ADMIN)
- `GET /api/calendar/ics` - ICS export

## Geliştirme

### Veritabanı İşlemleri

```bash
# Migration oluştur
npm run db:migrate

# Production migration
npx prisma migrate deploy

# Prisma Studio (veritabanı görüntüleyici)
npm run db:studio

# Seed data (sadece development)
npm run db:seed
```

### Build

```bash
npm run build
npm start
```

## Dokümantasyon

- **SYNC_GUIDE.md**: Yerel ve sunucu arasında senkronizasyon rehberi
- **UBUNTU_SETUP.md**: Ubuntu üzerinde adım adım kurulum rehberi
- **SETUP.md**: Detaylı kurulum ve deployment rehberi
- **DEPLOYMENT.md**: Production deployment detayları
- **QUICKSTART.md**: Hızlı başlangıç rehberi
- **UPDATE_EMAILS.md**: Email güncelleme rehberi
- **API**: Route handler'lar `app/api` klasöründe

## Güvenlik

- ✅ Environment variables asla commit edilmez
- ✅ Password hashing (bcrypt)
- ✅ JWT session management
- ✅ Role-based access control
- ✅ SQL injection koruması (Prisma)
- ⚠️ Production'da HTTPS kullanın
- ⚠️ Güçlü `NEXTAUTH_SECRET` kullanın
- ⚠️ Database şifrelerini güçlü tutun

## Sorun Giderme

### Veritabanı Bağlantı Hatası
- PostgreSQL'in çalıştığından emin olun
- `.env` dosyasındaki `DATABASE_URL`'i kontrol edin
- Firewall kurallarını kontrol edin

### NextAuth Hatası
- `NEXTAUTH_SECRET` en az 32 karakter olmalı
- `NEXTAUTH_URL` production'da https:// ile başlamalı

### Prisma Hatası
- `npm run db:generate` çalıştırın
- Migration'ları kontrol edin: `npm run db:migrate`

## Lisans

MIT
