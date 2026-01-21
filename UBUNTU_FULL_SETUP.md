# Ubuntu Sunucuda Ops Portal - Sıfırdan Kurulum Rehberi

Bu rehber, Ubuntu sunucusunda Ops Portal'ı sıfırdan kurmak ve production'a almak için tüm adımları içerir.

## 📋 İçindekiler

1. [Ön Gereksinimler](#ön-gereksinimler)
2. [Sistem Güncellemeleri](#1-adım-sistem-güncellemeleri)
3. [Node.js Kurulumu](#2-adım-nodejs-kurulumu)
4. [PostgreSQL Kurulumu](#3-adım-postgresql-kurulumu)
5. [Proje Kurulumu](#4-adım-proje-kurulumu)
6. [Veritabanı Yapılandırması](#5-adım-veritabanı-yapılandırması)
7. [Environment Variables](#6-adım-environment-variables)
8. [Uygulama Build ve Başlatma](#7-adım-uygulama-build-ve-başlatma)
9. [PM2 Yapılandırması](#8-adım-pm2-yapılandırması)
10. [Nginx Reverse Proxy](#9-adım-nginx-reverse-proxy-opsiyonel)
11. [SSL Sertifikası](#10-adım-ssl-sertifikası-let's-encrypt)
12. [Firewall Yapılandırması](#11-adım-firewall-yapılandırması)
13. [Test ve Doğrulama](#12-adım-test-ve-doğrulama)
14. [Sorun Giderme](#sorun-giderme)

---

## Ön Gereksinimler

- Ubuntu 20.04 veya üzeri
- Sudo yetkilerine sahip kullanıcı
- İnternet bağlantısı
- Domain adı (SSL için - opsiyonel)
- Minimum 1GB RAM, 10GB disk alanı

---

## 1. ADIM: Sistem Güncellemeleri

```bash
# Sistem paketlerini güncelle
sudo apt update
sudo apt upgrade -y

# Temel araçları kur
sudo apt install -y curl wget git build-essential software-properties-common
```

---

## 2. ADIM: Node.js Kurulumu

### Yöntem A: nvm ile Kurulum (Önerilen - Daha Esnek)

nvm (Node Version Manager) kullanarak Node.js kurulumu daha esnek ve güncel versiyonları kolayca yönetmenizi sağlar.

```bash
# nvm'i kur
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# nvm'i aktifleştir
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# nvm'in kurulduğunu kontrol et
nvm --version

# En son LTS versiyonu kur (Node.js 20.x veya 22.x)
nvm install --lts

# Veya belirli bir versiyon kur (Node.js 20.x önerilir)
nvm install 20

# Kurulu versiyonu aktif et
nvm use 20

# Varsayılan versiyonu ayarla
nvm alias default 20

# Versiyonları kontrol et
node --version
npm --version
```

**Beklenen çıktı**: 
- Node.js v20.x.x veya v22.x.x (LTS)
- npm 10.x.x

**nvm'i kalıcı olarak aktifleştirmek için:**

```bash
# .bashrc dosyasına ekle
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.bashrc

# Yeni terminal açın veya
source ~/.bashrc
```

### Yöntem B: NodeSource ile Kurulum (Alternatif)

Eğer nvm kullanmak istemiyorsanız, NodeSource repository ile de kurabilirsiniz:

```bash
# Node.js 20.x (LTS) kurulumu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js ve npm'i kur
sudo apt install -y nodejs

# Versiyonları kontrol et
node --version
npm --version
```

**Beklenen çıktı**: 
- Node.js v20.x.x (LTS)
- npm 10.x.x

### Node.js Versiyon Kontrolü

```bash
# Mevcut versiyonu göster
node --version

# npm versiyonunu göster
npm --version

# npm'i en son versiyona güncelle
npm install -g npm@latest
```

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

**Beklenen çıktı**: `active (running)`

---

## 4. ADIM: Proje Kurulumu

### Proje Klasörü Oluşturma

```bash
# Web dizini oluştur
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www

# Proje klasörüne git
cd /var/www
```

### Projeyi Kopyalama

**Seçenek A: Git ile (Önerilen)**

```bash
# Repository'yi clone et (kendi repository URL'inizi kullanın)
git clone https://github.com/KULLANICI_ADI/ops-portal.git ops-portal

# Klasöre git
cd ops-portal
```

**Seçenek B: SCP ile Manuel Kopyalama**

Yerel bilgisayarınızda (PowerShell veya Git Bash):

```bash
# Projeyi ZIP'le
cd C:\Users\DUMAN\Desktop\Portal
tar -czf portal.tar.gz --exclude='node_modules' --exclude='.next' --exclude='.env' .

# Sunucuya kopyala
scp portal.tar.gz user@sunucu-ip:/tmp/
```

Sunucuda:

```bash
# ZIP'i aç
cd /var/www
tar -xzf /tmp/portal.tar.gz -C ops-portal
cd ops-portal
rm /tmp/portal.tar.gz
```

### Bağımlılıkları Yükleme

```bash
# Production bağımlılıklarını yükle
npm install --production
```

Bu işlem birkaç dakika sürebilir.

---

## 5. ADIM: Veritabanı Yapılandırması

### Veritabanı ve Kullanıcı Oluşturma

```bash
# PostgreSQL'e postgres kullanıcısı ile bağlan
sudo -u postgres psql
```

PostgreSQL içinde şu komutları çalıştırın:

```sql
-- Veritabanı oluştur
CREATE DATABASE opsportal;

-- Kullanıcı oluştur ve şifre ata (ŞİFREYİ DEĞİŞTİRİN!)
CREATE USER opsportal WITH PASSWORD 'güçlü-şifre-buraya';

-- Yetkileri ver
GRANT ALL PRIVILEGES ON DATABASE opsportal TO opsportal;

-- PostgreSQL 15+ için schema yetkisi
\c opsportal
GRANT ALL ON SCHEMA public TO opsportal;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO opsportal;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO opsportal;

-- Çıkış
\q
```

**Önemli**: `güçlü-şifre-buraya` kısmını güçlü bir şifre ile değiştirin!

### Bağlantıyı Test Etme

```bash
# Bağlantıyı test et
psql -U opsportal -d opsportal -h localhost
```

Bağlantı başarılı olursa `\q` ile çıkın.

---

## 6. ADIM: Environment Variables

### .env Dosyası Oluşturma

```bash
# .env dosyası oluştur
nano .env
```

Aşağıdaki içeriği ekleyin (kendi bilgilerinize göre düzenleyin):

```env
# Database Connection
# PostgreSQL şifresini yukarıda oluşturduğunuz şifre ile değiştirin
DATABASE_URL="postgresql://opsportal:güçlü-şifre-buraya@localhost:5432/opsportal?schema=public"

# NextAuth Secret (güçlü bir rastgele string - en az 32 karakter)
# Şunu kullanabilirsiniz: openssl rand -base64 32
NEXTAUTH_SECRET="değiştirin-bu-secret-keyi-en-az-32-karakter-uzunlukta"

# NextAuth URL
# Development için: http://sunucu-ip:3000
# Production için: https://yourdomain.com
NEXTAUTH_URL="http://sunucu-ip:3000"

# Node Environment
NODE_ENV="production"
```

**Güçlü Secret Oluşturma:**

```bash
# Terminal'de çalıştırın ve çıktıyı NEXTAUTH_SECRET'a kopyalayın
openssl rand -base64 32
```

**Sunucu IP'sini Öğrenme:**

```bash
hostname -I
```

Dosyayı kaydedin: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 7. ADIM: Uygulama Build ve Başlatma

### Prisma Client Generate

```bash
# Prisma client'ı generate et
npm run db:generate
```

### Veritabanı Migration

```bash
# Migration'ları uygula
npm run db:migrate:deploy
```

İlk migration'da tablolar oluşturulacak.

### Seed Data (Örnek Kullanıcılar - Opsiyonel)

```bash
# Örnek kullanıcılar ve verileri yükle
npm run db:seed
```

Bu komut şu kullanıcıları oluşturur:
- `admin@opsportal.local` / `Admin123!`
- `manager1@opsportal.local` / `Manager123!`
- `member1@opsportal.local` / `Member123!`

**Not**: Production'da seed script'i çalıştırmadan önce düşünün!

### Production Build

```bash
# Production build oluştur
npm run build
```

Bu işlem birkaç dakika sürebilir. Başarılı olursa `.next` klasörü oluşur.

---

## 8. ADIM: PM2 Yapılandırması

### PM2 Kurulumu

```bash
# PM2'yi global olarak kur
sudo npm install -g pm2

# PM2 versiyonunu kontrol et
pm2 --version
```

### PM2 ile Uygulamayı Başlatma

**Seçenek A: Basit Başlatma**

```bash
# Production modunda başlat
NODE_ENV=production pm2 start npm --name "ops-portal" -- start

# Durumu kontrol et
pm2 status

# Logları görüntüle
pm2 logs ops-portal
```

**Seçenek B: Otomatik Script ile (Önerilen)**

```bash
# Script'i çalıştırılabilir yap
chmod +x scripts/start-server.sh

# Sunucuyu başlat
./scripts/start-server.sh
```

**Seçenek C: Ecosystem Dosyası ile**

```bash
# Ecosystem dosyasını kopyala
cp ecosystem.config.example.js ecosystem.config.js

# Düzenle (gerekirse)
nano ecosystem.config.js
```

`cwd` yolunu kontrol edin:

```javascript
cwd: '/var/www/ops-portal',
```

PM2'yi ecosystem dosyası ile başlatın:

```bash
pm2 start ecosystem.config.js

# PM2'yi sistem başlangıcında otomatik başlat
pm2 startup
pm2 save
```

**Not**: `pm2 startup` komutu size bir komut verecek, onu çalıştırmanız gerekecek. Örnek:

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u kullanici --hp /home/kullanici
```

### PM2 Durumunu Kontrol Etme

```bash
# PM2 durumu
pm2 status

# Detaylı bilgi
pm2 info ops-portal

# Logları canlı görüntüle
pm2 logs ops-portal --lines 50

# Port kullanımını kontrol et
sudo netstat -tulpn | grep 3000
```

---

## 9. ADIM: Nginx Reverse Proxy (Opsiyonel ama Önerilen)

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

    # Log dosyaları
    access_log /var/log/nginx/ops-portal-access.log;
    error_log /var/log/nginx/ops-portal-error.log;

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
        
        # Timeout ayarları
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
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

## 10. ADIM: SSL Sertifikası (Let's Encrypt)

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

### .env Dosyasını Güncelleme

SSL kurulduktan sonra `.env` dosyasını güncelleyin:

```bash
nano .env
```

```env
NEXTAUTH_URL="https://yourdomain.com"
```

PM2'yi yeniden başlatın:

```bash
pm2 restart ops-portal
```

---

## 11. ADIM: Firewall Yapılandırması

```bash
# UFW firewall'u kur
sudo apt install -y ufw

# SSH'ı aç (ÖNEMLİ - yoksa bağlantınız kesilir!)
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

## 12. ADIM: Test ve Doğrulama

### Uygulama Durumunu Kontrol Etme

```bash
# PM2 durumu
pm2 status

# Uygulama logları
pm2 logs ops-portal --lines 20

# Port kontrolü
sudo netstat -tulpn | grep 3000

# Sunucu IP'sini öğren
hostname -I
```

### Tarayıcıda Test Etme

**Yerel IP ile:**
- `http://SUNUCU-IP:3000` (Nginx yoksa)
- `http://SUNUCU-IP` (Nginx varsa)

**Domain ile:**
- `https://yourdomain.com` (SSL kuruluysa)
- `http://yourdomain.com` (SSL yoksa)

### İlk Giriş

Tarayıcıda uygulamaya gidin ve şu bilgilerle giriş yapın:

- **Email**: `admin@opsportal.local`
- **Şifre**: `Admin123!`

**Önemli**: Production'da bu kullanıcıları değiştirmeyi unutmayın!

---

## PM2 Komutları Referansı

```bash
pm2 status              # Tüm uygulamaların durumu
pm2 logs ops-portal     # Logları görüntüle
pm2 logs ops-portal --lines 100  # Son 100 satır
pm2 restart ops-portal  # Yeniden başlat
pm2 stop ops-portal     # Durdur
pm2 delete ops-portal   # Sil
pm2 reload ops-portal   # Zero-downtime reload
pm2 monit               # Monitoring dashboard
pm2 save                # Mevcut listeyi kaydet
pm2 startup             # Sistem başlangıcında otomatik başlat
```

---

## Güncelleme Prosedürü

Kod güncellemesi yaptıktan sonra:

```bash
cd /var/www/ops-portal

# Git kullanıyorsanız
git pull

# Bağımlılıkları güncelle
npm install --production

# Prisma client generate
npm run db:generate

# Migration'ları uygula
npm run db:migrate:deploy

# Build
npm run build

# PM2'yi yeniden başlat
pm2 restart ops-portal
```

Veya otomatik script kullanın:

```bash
chmod +x scripts/update-ops-portal.sh
./scripts/update-ops-portal.sh update
```

---

## Backup Stratejisi

### Veritabanı Backup Script'i

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

# .env dosyasından şifreyi al (güvenli değil ama çalışır)
DB_PASSWORD=$(grep DATABASE_URL /var/www/ops-portal/.env | sed 's/.*:\([^@]*\)@.*/\1/')

# PostgreSQL backup
PGPASSWORD="$DB_PASSWORD" pg_dump -U opsportal -h localhost opsportal > $BACKUP_DIR/backup_$DATE.sql

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

## Monitoring ve Logging

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

## Sorun Giderme

### Uygulama Çalışmıyor

```bash
# PM2 durumunu kontrol et
pm2 status

# Logları incele
pm2 logs ops-portal --lines 100

# Port kullanımını kontrol et
sudo netstat -tulpn | grep 3000

# Process'i manuel başlat
cd /var/www/ops-portal
NODE_ENV=production node server.js
```

### Veritabanı Bağlantı Hatası

```bash
# PostgreSQL'in çalıştığını kontrol et
sudo systemctl status postgresql

# Bağlantıyı test et
psql -U opsportal -d opsportal -h localhost

# .env dosyasındaki DATABASE_URL'i kontrol et
cat .env | grep DATABASE_URL

# PostgreSQL loglarını kontrol et
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### NextAuth Hatası

```bash
# NEXTAUTH_SECRET'ı kontrol et (en az 32 karakter)
cat .env | grep NEXTAUTH_SECRET

# NEXTAUTH_URL'i kontrol et
cat .env | grep NEXTAUTH_URL

# Secret'ı yeniden oluştur
openssl rand -base64 32
```

### Build Hatası

```bash
# Node versiyonunu kontrol et
node --version  # 18+ olmalı

# .next klasörünü sil ve tekrar build et
rm -rf .next
npm run build

# Prisma client'ı yeniden generate et
npm run db:generate
```

### Nginx Hatası

```bash
# Nginx konfigürasyonunu test et
sudo nginx -t

# Nginx loglarını kontrol et
sudo tail -f /var/log/nginx/error.log

# Nginx'i yeniden başlat
sudo systemctl restart nginx
```

### Port 3000 Kullanımda

```bash
# Hangi process port 3000'i kullanıyor?
sudo lsof -i :3000

# Process'i durdur
sudo kill -9 <PID>

# Veya PM2'deki eski instance'ı sil
pm2 delete ops-portal
```

### Permission Denied Hatası

```bash
# Klasör sahipliğini kontrol et
ls -la /var/www/ops-portal

# Sahipliği değiştir
sudo chown -R $USER:$USER /var/www/ops-portal

# İzinleri düzenle
chmod -R 755 /var/www/ops-portal
```

---

## Güvenlik Kontrol Listesi

- [ ] PostgreSQL şifresi güçlü ve güvenli
- [ ] NEXTAUTH_SECRET güçlü ve rastgele (32+ karakter)
- [ ] HTTPS aktif ve çalışıyor
- [ ] Firewall yapılandırıldı
- [ ] SSH key authentication kullanılıyor (önerilen)
- [ ] Root login devre dışı
- [ ] Düzenli backup alınıyor
- [ ] Log rotation aktif
- [ ] Production'da seed script çalıştırılmadı (veya test kullanıcıları değiştirildi)
- [ ] Environment variables güvenli (.env dosyası erişilemez)
- [ ] PM2 otomatik başlatma yapılandırıldı
- [ ] Nginx güvenlik başlıkları eklendi (opsiyonel)

---

## Hızlı Komut Özeti

```bash
# Sistem
sudo apt update && sudo apt upgrade -y

# Node.js (nvm ile - önerilen)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
nvm alias default --lts

# Veya NodeSource ile (alternatif)
# curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
# sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql  # Veritabanı oluştur

# Proje
cd /var/www
git clone <repo-url> ops-portal
cd ops-portal
npm install --production

# Environment
nano .env  # DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# Build ve Başlat
npm run db:generate
npm run db:migrate:deploy
npm run build
pm2 start npm --name "ops-portal" -- start
pm2 save
pm2 startup
```

---

## Tamamlandı! 🎉

Uygulamanız artık production'da çalışıyor. 

**Erişim:**
- Yerel IP: `http://SUNUCU-IP:3000`
- Domain: `https://yourdomain.com` (Nginx + SSL kuruluysa)

**İlk Giriş:**
- Email: `admin@opsportal.local`
- Şifre: `Admin123!`

**Önemli**: Production'da test kullanıcılarını değiştirmeyi unutmayın!

---

## Ek Kaynaklar

- **PM2 Dokümantasyonu**: https://pm2.keymetrics.io/
- **Nginx Dokümantasyonu**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/
- **PostgreSQL Dokümantasyonu**: https://www.postgresql.org/docs/

---

## Destek

Sorun yaşarsanız:
1. Logları kontrol edin: `pm2 logs ops-portal`
2. Sistem loglarını kontrol edin: `sudo journalctl -u nginx`
3. Veritabanı bağlantısını test edin: `psql -U opsportal -d opsportal`
