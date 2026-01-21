# Ubuntu Kurulum Rehberi - Adım Adım

Bu rehber, Ops Portal'ı Ubuntu 20.04+ üzerinde sıfırdan kurmak için tüm adımları içerir.

## Ön Gereksinimler

- Ubuntu 20.04 veya üzeri
- Sudo yetkilerine sahip kullanıcı
- İnternet bağlantısı

---

## 1. ADIM: Sistem Güncellemeleri

```bash
# Sistem paketlerini güncelle
sudo apt update
sudo apt upgrade -y

# Temel araçları kur
sudo apt install -y curl wget git build-essential
```

---

## 2. ADIM: Node.js Kurulumu (18+)

### Node.js 18.x Kurulumu

```bash
# NodeSource repository ekle
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js ve npm'i kur
sudo apt install -y nodejs

# Versiyonları kontrol et
node --version
npm --version
```

**Beklenen çıktı**: Node.js v18.x.x ve npm 9.x.x

---

## 3. ADIM: PostgreSQL Kurulumu

### PostgreSQL 15 Kurulumu

```bash
# PostgreSQL repository ekle
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Paket listesini güncelle
sudo apt update

# PostgreSQL'i kur
sudo apt install -y postgresql postgresql-contrib

# PostgreSQL servisini başlat ve otomatik başlatmayı etkinleştir
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Durumu kontrol et
sudo systemctl status postgresql
```

### Veritabanı ve Kullanıcı Oluşturma

```bash
# PostgreSQL'e postgres kullanıcısı ile bağlan
sudo -u postgres psql
```

PostgreSQL içinde şu komutları çalıştırın:

```sql
-- Veritabanı oluştur
CREATE DATABASE opsportal;

-- Kullanıcı oluştur ve şifre ata
CREATE USER opsportal WITH PASSWORD 'yusufduman34';

-- Yetkileri ver
GRANT ALL PRIVILEGES ON DATABASE opsportal TO opsportal;

-- PostgreSQL 15+ için schema yetkisi
\c opsportal
GRANT ALL ON SCHEMA public TO opsportal;

-- Çıkış
\q
```

**Önemli**: `güçlü-şifre-buraya-değiştirin` kısmını güçlü bir şifre ile değiştirin!

---

## 4. ADIM: Proje Klasörü Oluşturma

```bash
# Web dizini oluştur (opsiyonel, istediğiniz yere koyabilirsiniz)
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www

# Proje klasörüne git
cd /var/www
```

### Projeyi Kopyalama

**Seçenek A: Git ile (önerilen)**

```bash
# Repository'yi clone et
git clone <repository-url> ops-portal
cd ops-portal
```

**Seçenek B: Manuel Dosya Kopyalama**

```bash
# Dosyalarınızı /var/www/ops-portal klasörüne kopyalayın
# Örnek: SCP ile
# scp -r ./ops-portal user@server:/var/www/
```

---

## 5. ADIM: Proje Bağımlılıklarını Yükleme

```bash
# Proje klasörüne git
cd /var/www/ops-portal

# Bağımlılıkları yükle
npm install
```

Bu işlem birkaç dakika sürebilir.

---

## 6. ADIM: Environment Variables Ayarlama

```bash
# .env dosyası oluştur
nano .env
```

Aşağıdaki içeriği ekleyin (kendi bilgilerinize göre düzenleyin):

```env
# Database Connection
# PostgreSQL şifresini yukarıda oluşturduğunuz şifre ile değiştirin
DATABASE_URL="postgresql://opsportal:güçlü-şifre-buraya-değiştirin@localhost:5432/opsportal?schema=public"

# NextAuth Secret (güçlü bir rastgele string - en az 32 karakter)
# Şunu kullanabilirsiniz: openssl rand -base64 32
NEXTAUTH_SECRET="değiştirin-bu-secret-keyi-en-az-32-karakter-uzunlukta"

# NextAuth URL (development için localhost, production için domain)
NEXTAUTH_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

**Güçlü Secret Oluşturma:**

```bash
# Terminal'de çalıştırın ve çıktıyı NEXTAUTH_SECRET'a kopyalayın
openssl rand -base64 32
```

Dosyayı kaydedin: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 7. ADIM: Prisma Client Generate

```bash
# Prisma client'ı generate et
npm run db:generate
```

---

## 8. ADIM: Veritabanı Migration

```bash
# Migration'ları uygula
npm run db:migrate
```

İlk migration'da bir migration adı isteyecek, örneğin: `init`

---

## 9. ADIM: Seed Data (Örnek Kullanıcılar)

```bash
# Örnek kullanıcılar ve verileri yükle
npm run db:seed
```

Bu komut şu kullanıcıları oluşturur:
- `admin@opsportal.local` / `Admin123!`
- `manager1@opsportal.local` / `Manager123!`
- `member1@opsportal.local` / `Member123!`

---

## 10. ADIM: Development Server'ı Test Etme

```bash
# Development server'ı başlat
npm run dev
```

Tarayıcıda `http://localhost:3000` adresine gidin.

**Test için giriş:**
- Email: `admin@opsportal.local`
- Şifre: `Admin123!`

Sunucuyu durdurmak için: `Ctrl+C`

---

## 11. ADIM: Production Build

```bash
# Production build oluştur
npm run build
```

Build başarılı olursa `.next` klasörü oluşur.

---

## 12. ADIM: PM2 Kurulumu ve Yapılandırması

### PM2 Kurulumu

```bash
# PM2'yi global olarak kur
sudo npm install -g pm2
```

### PM2 ile Uygulamayı Başlatma

```bash
# Production modunda başlat
NODE_ENV=production pm2 start npm --name "ops-portal" -- start

# PM2 durumunu kontrol et
pm2 status

# Logları görüntüle
pm2 logs ops-portal

# PM2'yi sistem başlangıcında otomatik başlat
pm2 startup
pm2 save
```

**Not**: `pm2 startup` komutu size bir komut verecek, onu çalıştırmanız gerekecek.

### PM2 Ecosystem Dosyası (Opsiyonel - Önerilen)

```bash
# Ecosystem dosyasını kopyala
cp ecosystem.config.example.js ecosystem.config.js

# Düzenle
nano ecosystem.config.js
```

`cwd` yolunu kendi proje yolunuza göre güncelleyin:

```javascript
cwd: '/var/www/ops-portal',
```

PM2'yi ecosystem dosyası ile başlatın:

```bash
pm2 delete ops-portal  # Önceki instance'ı sil
pm2 start ecosystem.config.js
pm2 save
```

---

## 13. ADIM: Nginx Reverse Proxy (Opsiyonel ama Önerilen)

### Nginx Kurulumu

```bash
# Nginx'i kur
sudo apt install -y nginx

# Nginx'i başlat ve otomatik başlatmayı etkinleştir
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Nginx Konfigürasyonu

```bash
# Site konfigürasyon dosyası oluştur
sudo nano /etc/nginx/sites-available/ops-portal
```

Aşağıdaki içeriği ekleyin (domain adınızı değiştirin):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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

Site'ı aktifleştirin:

```bash
# Symbolic link oluştur
sudo ln -s /etc/nginx/sites-available/ops-portal /etc/nginx/sites-enabled/

# Default site'ı devre dışı bırak (opsiyonel)
sudo rm /etc/nginx/sites-enabled/default

# Nginx konfigürasyonunu test et
sudo nginx -t

# Nginx'i yeniden yükle
sudo systemctl reload nginx
```

---

## 14. ADIM: SSL Sertifikası (Let's Encrypt)

### Certbot Kurulumu

```bash
# Certbot'u kur
sudo apt install -y certbot python3-certbot-nginx
```

### SSL Sertifikası Alma

```bash
# SSL sertifikası al (domain adınızı değiştirin)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot size birkaç soru soracak:
- Email adresi (isteğe bağlı)
- Terms of Service kabulü
- Email paylaşımı (isteğe bağlı)

### Otomatik Yenileme Testi

```bash
# Otomatik yenilemeyi test et
sudo certbot renew --dry-run
```

SSL sertifikası otomatik olarak yenilenecektir (cron job ile).

---

## 15. ADIM: Firewall Yapılandırması

```bash
# UFW firewall'u kur
sudo apt install -y ufw

# SSH'ı aç (önemli - yoksa bağlantınız kesilir!)
sudo ufw allow 22/tcp

# HTTP ve HTTPS'i aç
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Firewall'u aktifleştir
sudo ufw enable

# Durumu kontrol et
sudo ufw status
```

---

## 16. ADIM: Environment Variables Güncelleme (Production)

Production için `.env` dosyasını güncelleyin:

```bash
nano .env
```

```env
DATABASE_URL="postgresql://opsportal:güçlü-şifre@localhost:5432/opsportal?schema=public"
NEXTAUTH_SECRET="production-secret-key-min-32-chars"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

PM2'yi yeniden başlatın:

```bash
pm2 restart ops-portal
```

---

## 17. ADIM: Veritabanı Backup (Önerilen)

### Backup Script Oluşturma

```bash
# Backup script oluştur
sudo nano /usr/local/bin/backup-ops-portal.sh
```

İçerik:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ops-portal"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# PostgreSQL şifresini .pgpass dosyasına ekleyin veya PGPASSWORD kullanın
PGPASSWORD='güçlü-şifre-buraya' pg_dump -U opsportal -h localhost opsportal > $BACKUP_DIR/backup_$DATE.sql

# 7 günden eski backup'ları sil
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql"
```

Script'i çalıştırılabilir yapın:

```bash
sudo chmod +x /usr/local/bin/backup-ops-portal.sh
```

### Cron Job Ekleme (Günlük Backup)

```bash
# Crontab'ı düzenle
crontab -e
```

Aşağıdaki satırı ekleyin (her gün saat 02:00'de backup):

```
0 2 * * * /usr/local/bin/backup-ops-portal.sh >> /var/log/ops-portal-backup.log 2>&1
```

---

## 18. ADIM: Monitoring ve Logging

### PM2 Log Rotation

```bash
# PM2 log rotate modülünü kur
pm2 install pm2-logrotate

# Log ayarlarını yap
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### Log Konumları

- **PM2 Logs**: `~/.pm2/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **PostgreSQL Logs**: `/var/log/postgresql/`

---

## 19. ADIM: Güvenlik Kontrol Listesi

- [ ] PostgreSQL şifresi güçlü ve güvenli
- [ ] NEXTAUTH_SECRET güçlü ve rastgele (32+ karakter)
- [ ] HTTPS aktif ve çalışıyor
- [ ] Firewall yapılandırıldı
- [ ] SSH key authentication kullanılıyor (önerilen)
- [ ] Root login devre dışı
- [ ] Düzenli backup alınıyor
- [ ] Log rotation aktif
- [ ] Production'da seed script çalıştırılmadı
- [ ] Environment variables güvenli

---

## 20. ADIM: Güncelleme Prosedürü

Uygulamayı güncellerken:

```bash
# 1. Backup al
/usr/local/bin/backup-ops-portal.sh

# 2. Kodu güncelle (Git ile)
cd /var/www/ops-portal
git pull

# 3. Bağımlılıkları güncelle
npm install --production

# 4. Prisma client generate
npm run db:generate

# 5. Migration'ları uygula (yeni migration varsa)
npm run db:migrate:deploy

# 6. Build
npm run build

# 7. PM2'yi yeniden başlat
pm2 restart ops-portal
```

---

## Sorun Giderme

### Uygulama Çalışmıyor

```bash
# PM2 durumunu kontrol et
pm2 status

# Logları incele
pm2 logs ops-portal --lines 100

# Port kullanımını kontrol et
sudo netstat -tulpn | grep 3000
```

### Veritabanı Bağlantı Hatası

```bash
# PostgreSQL'in çalıştığını kontrol et
sudo systemctl status postgresql

# Bağlantıyı test et
psql -U opsportal -d opsportal -h localhost

# .env dosyasındaki DATABASE_URL'i kontrol et
cat .env | grep DATABASE_URL
```

### Nginx Hatası

```bash
# Nginx konfigürasyonunu test et
sudo nginx -t

# Nginx loglarını kontrol et
sudo tail -f /var/log/nginx/error.log
```

### Port 3000 Kullanımda

```bash
# Hangi process port 3000'i kullanıyor?
sudo lsof -i :3000

# Process'i durdur
sudo kill -9 <PID>
```

---

## Hızlı Komut Referansı

```bash
# PM2 Komutları
pm2 status              # Durum
pm2 logs ops-portal      # Loglar
pm2 restart ops-portal   # Yeniden başlat
pm2 stop ops-portal      # Durdur
pm2 delete ops-portal    # Sil

# Nginx Komutları
sudo nginx -t           # Test
sudo systemctl reload nginx  # Yeniden yükle
sudo systemctl restart nginx # Yeniden başlat

# PostgreSQL Komutları
sudo systemctl status postgresql   # Durum
sudo systemctl restart postgresql  # Yeniden başlat
sudo -u postgres psql              # PostgreSQL'e bağlan

# Log Görüntüleme
pm2 logs ops-portal --lines 50
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/postgresql/postgresql-*.log
```

---

## Tamamlandı! 🎉

Uygulamanız artık production'da çalışıyor. Tarayıcıda domain adınıza giderek test edebilirsiniz.

**İlk Giriş:**
- Email: `admin@opsportal.local`
- Şifre: `Admin123!`

**Önemli**: Production'da bu kullanıcıları değiştirmeyi unutmayın!

---

## Ek Kaynaklar

- **SETUP.md**: Genel kurulum rehberi
- **DEPLOYMENT.md**: Detaylı deployment bilgileri
- **README.md**: Proje genel bilgileri
