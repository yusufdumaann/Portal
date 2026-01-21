# Ops Portal - Kurulum ve Çalıştırma Rehberi

## Hızlı Başlangıç

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Environment Değişkenlerini Ayarlayın

`.env` dosyası oluşturun ve aşağıdaki içeriği ekleyin:

```env
# Database
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/opsportal?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-change-in-production-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

**Önemli**: 
- `NEXTAUTH_SECRET` için en az 32 karakterlik bir string kullanın. Production'da güvenli bir değer kullanın.
- `DATABASE_URL` formatı: `postgresql://KULLANICI:ŞİFRE@HOST:PORT/VERİTABANI?schema=public`

### 3. Veritabanını Hazırlayın

#### Seçenek A: Yerel PostgreSQL (Önerilen - Production için)

1. PostgreSQL'i kurun ve başlatın
2. Veritabanı oluşturun:
```sql
CREATE DATABASE opsportal;
CREATE USER opsportal WITH PASSWORD 'opsportal123';
GRANT ALL PRIVILEGES ON DATABASE opsportal TO opsportal;
```

3. `.env` dosyasındaki `DATABASE_URL`'i güncelleyin:
```env
DATABASE_URL="postgresql://opsportal:opsportal123@localhost:5432/opsportal?schema=public"
```

4. Migration ve seed komutlarını çalıştırın:
```bash
npm run db:migrate
npm run db:seed
```

#### Seçenek B: Bulut PostgreSQL (Production)

Heroku Postgres, AWS RDS, DigitalOcean, vb. kullanıyorsanız:

1. Bulut sağlayıcınızdan PostgreSQL connection string'i alın
2. `.env` dosyasındaki `DATABASE_URL`'i güncelleyin
3. Migration'ları çalıştırın:
```bash
npm run db:migrate
npm run db:seed
```

### 4. Development Server'ı Başlatın

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## Production Deployment

### 1. Build Oluşturun

```bash
# Prisma client'ı generate edin
npm run db:generate

# Production build
npm run build
```

### 2. Environment Variables Ayarlayın

Production sunucunuzda `.env` dosyasını oluşturun:

```env
DATABASE_URL="postgresql://kullanici:sifre@host:5432/opsportal?schema=public"
NEXTAUTH_SECRET="production-secret-key-min-32-chars"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

### 3. Uygulamayı Başlatın

```bash
npm start
```

### 4. Process Manager Kullanımı (PM2)

Production'da PM2 kullanmanız önerilir:

```bash
# PM2'yi global olarak yükleyin
npm install -g pm2

# Uygulamayı başlatın
pm2 start npm --name "ops-portal" -- start

# Otomatik başlatma için
pm2 startup
pm2 save
```

### 5. Reverse Proxy (Nginx)

Nginx örnek konfigürasyonu:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

SSL için Let's Encrypt kullanın:
```bash
sudo certbot --nginx -d yourdomain.com
```

## Örnek Kullanıcılar

Seed script çalıştırıldıktan sonra aşağıdaki kullanıcılar oluşturulur:

| Email | Şifre | Rol |
|-------|-------|-----|
| admin@opsportal.local | Admin123! | ADMIN |
| manager1@opsportal.local | Manager123! | MANAGER |
| manager2@opsportal.local | Manager123! | MANAGER |
| member1@opsportal.local | Member123! | MEMBER |
| member2@opsportal.local | Member123! | MEMBER |
| member3@opsportal.local | Member123! | MEMBER |

**Production'da bu kullanıcıları değiştirmeyi unutmayın!**

## Sayfa Yapısı

### `/` - Dashboard
- Bugünün özeti (nöbetçi, eventler)
- Yaklaşan eventler (7 gün)
- Hızlı aksiyonlar (event/nöbet oluştur)

### `/calendar` - Takvim
- **Aylık görünüm**: Grid layout, event kartları
- **Haftalık görünüm**: Günlük event listesi
- **Agenda görünümü**: Tüm eventlerin listesi
- Filtreleme: Tür, öncelik, sahip
- ICS export

### `/oncall` - Nöbet Planlama
- Aktif nöbet bilgisi
- Nöbet listesi
- İstatistikler (son 30 gün)
- Nöbet oluşturma/düzenleme

### `/users` - Kullanıcı Yönetimi (Sadece ADMIN)
- Kullanıcı listesi
- Yeni kullanıcı oluşturma
- Rol güncelleme

### `/settings` - Ayarlar
- Profil bilgileri (salt okunur)
- Tema değiştirme (dark/light)

## Roller ve Yetkiler

### ADMIN
- ✅ Tüm yönetim yetkileri
- ✅ Kullanıcı oluşturma/silme
- ✅ Rol atama
- ✅ Event ve nöbet yönetimi
- ✅ Tüm eventleri görüntüleme

### MANAGER
- ✅ Event oluşturma/düzenleme/silme
- ✅ Nöbet planlama
- ✅ Tüm eventleri görüntüleme
- ❌ Kullanıcı yönetimi

### MEMBER
- ✅ Kendi eventlerini görüntüleme
- ✅ Katıldığı eventleri görüntüleme
- ✅ Nöbet bilgilerini görüntüleme
- ❌ Event/nöbet oluşturma
- ❌ Kullanıcı yönetimi

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth endpoint

### Events
- `GET /api/events` - Event listesi (filtrelerle)
- `POST /api/events` - Yeni event oluştur
- `GET /api/events/:id` - Event detayı
- `PUT /api/events/:id` - Event güncelle
- `DELETE /api/events/:id` - Event sil

### Shifts
- `GET /api/shifts` - Nöbet listesi
- `POST /api/shifts` - Yeni nöbet oluştur
- `GET /api/shifts/:id` - Nöbet detayı
- `PUT /api/shifts/:id` - Nöbet güncelle
- `DELETE /api/shifts/:id` - Nöbet sil
- `GET /api/shifts/stats` - İstatistikler

### Users (ADMIN only)
- `GET /api/users` - Kullanıcı listesi
- `POST /api/users` - Yeni kullanıcı oluştur
- `PUT /api/users/:id/role` - Rol güncelle

### Calendar
- `GET /api/calendar/ics` - ICS export

## Veritabanı İşlemleri

### Migration oluştur

```bash
npm run db:migrate
```

### Production migration

```bash
# Production'da migrate deploy kullanın
npx prisma migrate deploy
```

### Prisma Studio (GUI)

```bash
npm run db:studio
```

### Seed data

```bash
npm run db:seed
```

**Not**: Production'da seed script'i çalıştırmayın!

## Hosting Önerileri

### VPS (DigitalOcean, Linode, AWS EC2, vb.)

1. Node.js 18+ kurun
2. PostgreSQL kurun ve yapılandırın
3. Projeyi clone edin
4. `.env` dosyasını ayarlayın
5. `npm install` çalıştırın
6. `npm run build` çalıştırın
7. PM2 ile başlatın
8. Nginx reverse proxy kurun

### Platform as a Service (PaaS)

#### Vercel
- Next.js için optimize edilmiş
- PostgreSQL için Vercel Postgres veya harici DB kullanın
- Environment variables'ı Vercel dashboard'dan ayarlayın
- Git push ile otomatik deploy

#### Railway
- PostgreSQL ve Node.js desteği
- Git push ile otomatik deploy
- Environment variables'ı dashboard'dan ayarlayın

#### Render
- PostgreSQL ve Node.js desteği
- Git push ile otomatik deploy
- Environment variables'ı dashboard'dan ayarlayın

#### Heroku
- PostgreSQL addon kullanın
- Git push ile otomatik deploy
- Environment variables'ı config vars'dan ayarlayın

## Sorun Giderme

### Veritabanı bağlantı hatası
- PostgreSQL'in çalıştığından emin olun
- `.env` dosyasındaki `DATABASE_URL`'i kontrol edin
- Firewall kurallarını kontrol edin (production'da)
- SSL bağlantısı gerekiyorsa: `?sslmode=require` ekleyin

### NextAuth hatası
- `NEXTAUTH_SECRET`'in en az 32 karakter olduğundan emin olun
- `NEXTAUTH_URL`'in doğru olduğundan emin olun (production'da https:// kullanın)

### Prisma hatası
- `npm run db:generate` komutunu çalıştırın
- Migration'ların uygulandığından emin olun: `npm run db:migrate`
- Production'da: `npx prisma migrate deploy`

### Build hatası
- Node.js versiyonunu kontrol edin (18+ gerekli)
- `node_modules` ve `.next` klasörlerini silip tekrar `npm install` yapın
- Prisma client'ı generate edin: `npm run db:generate`

## Güvenlik Önerileri

1. **Environment Variables**: Production'da asla commit etmeyin
2. **NEXTAUTH_SECRET**: Güçlü, rastgele bir string kullanın
3. **Database**: Güçlü şifreler kullanın, SSL bağlantısı kullanın
4. **HTTPS**: Production'da mutlaka HTTPS kullanın
5. **Rate Limiting**: API endpoint'lerine rate limiting ekleyin
6. **CORS**: Gerekirse CORS ayarlarını yapılandırın

## Teknik Detaylar

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (JWT strategy)
- **UI**: TailwindCSS + shadcn/ui
- **State**: React Query (TanStack Query)
- **Validation**: Zod
- **Icons**: Lucide React
- **Node.js**: 18+ gerekli

## Lisans

MIT
