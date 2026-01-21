# Email Adreslerini Güncelleme

Bu rehber, veritabanındaki mevcut kullanıcıların email adreslerini `@local` formatından `@opsportal.local` formatına güncellemek için kullanılır.

## Yöntem 1: Otomatik Script (Önerilen)

```bash
# Email güncelleme script'ini çalıştır
npm run db:update-emails
```

Bu script şu email'leri güncelleyecektir:
- `admin@local` → `admin@opsportal.local`
- `manager1@local` → `manager1@opsportal.local`
- `manager2@local` → `manager2@opsportal.local`
- `member1@local` → `member1@opsportal.local`
- `member2@local` → `member2@opsportal.local`
- `member3@local` → `member3@opsportal.local`

## Yöntem 2: Manuel SQL Güncelleme

PostgreSQL'e bağlanın:

```bash
psql -U opsportal -d opsportal
```

SQL komutlarını çalıştırın:

```sql
-- Email'leri güncelle
UPDATE users 
SET email = 'admin@opsportal.local' 
WHERE email = 'admin@local';

UPDATE users 
SET email = 'manager1@opsportal.local' 
WHERE email = 'manager1@local';

UPDATE users 
SET email = 'manager2@opsportal.local' 
WHERE email = 'manager2@local';

UPDATE users 
SET email = 'member1@opsportal.local' 
WHERE email = 'member1@local';

UPDATE users 
SET email = 'member2@opsportal.local' 
WHERE email = 'member2@local';

UPDATE users 
SET email = 'member3@opsportal.local' 
WHERE email = 'member3@local';

-- Güncellemeleri kontrol et
SELECT id, name, email, role FROM users;

-- Çıkış
\q
```

## Yöntem 3: Seed Script'i Tekrar Çalıştırma

Eğer test verilerini silip yeniden oluşturmak istiyorsanız:

```bash
# Dikkat: Bu tüm verileri siler ve yeniden oluşturur!
npm run db:seed
```

**Uyarı**: Bu yöntem tüm mevcut verileri (events, shifts, vb.) siler ve sadece seed verilerini oluşturur.

## Güncelleme Sonrası

Güncelleme sonrası yeni giriş bilgileri:

- **Admin**: `admin@opsportal.local` / `Admin123!`
- **Manager**: `manager1@opsportal.local` / `Manager123!`
- **Member**: `member1@opsportal.local` / `Member123!`

## Sorun Giderme

### "Email zaten mevcut" hatası

Eğer yeni email zaten varsa, önce eski kullanıcıyı silin veya farklı bir email kullanın.

### "Kullanıcı bulunamadı" uyarısı

Bu normaldir - kullanıcı zaten güncellenmiş olabilir veya hiç oluşturulmamış olabilir.

### Veritabanı bağlantı hatası

`.env` dosyasındaki `DATABASE_URL`'i kontrol edin:

```bash
cat .env | grep DATABASE_URL
```
