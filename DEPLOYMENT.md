# Production Deployment Rehberi

Bu rehber, Ops Portal'ı production ortamına deploy etmek için adım adım talimatlar içerir.

## Genel Bakış

Ops Portal normal bir hosting mimarisinde çalışacak şekilde tasarlanmıştır:
- **Web Server**: Next.js (Node.js)
- **Database**: PostgreSQL (ayrı servis)
- **Process Manager**: PM2 (önerilen)
- **Reverse Proxy**: Nginx (önerilen)

## 1. Sunucu Gereksinimleri

### Minimum Gereksinimler
- **CPU**: 1 core
- **RAM**: 1 GB
- **Disk**: 10 GB
- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+

### Önerilen Gereksinimler
- **CPU**: 2+ cores
- **RAM**: 2+ GB
- **Disk**: 20+ GB SSD
- **OS**: Ubuntu 22.04 LTS

## 2. Sunucu Hazırlığı

### Node.js Kurulumu

```bash
# Node.js 18+ kurun
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Versiyonu kontrol edin
node --version
npm --version
```

### PostgreSQL Kurulumu

```bash
# PostgreSQL kurun
sudo apt update
sudo apt install postgresql postgresql-contrib

# PostgreSQL servisini başlatın
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Veritabanı oluşturun
sudo -u postgres psql
```

PostgreSQL içinde:
```sql
CREATE DATABASE opsportal;
CREATE USER opsportal WITH PASSWORD 'güçlü-şifre-buraya';
GRANT ALL PRIVILEGES ON DATABASE opsportal TO opsportal;
\q
```

### Nginx Kurulumu (Opsiyonel ama önerilen)

```bash
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 3. Uygulama Deployment

### Projeyi Sunucuya Aktarın

```bash
# Git ile
git clone <repository-url> /var/www/ops-portal
cd /var/www/ops-portal

# veya SCP ile
scp -r ./ops-portal user@server:/var/www/
```

### Bağımlılıkları Yükleyin

```bash
cd /var/www/ops-portal
npm install --production
```

### Environment Variables

`.env` dosyası oluşturun:

```bash
nano /var/www/ops-portal/.env
```

İçerik:
```env
DATABASE_URL="postgresql://opsportal:güçlü-şifre-buraya@localhost:5432/opsportal?schema=public"
NEXTAUTH_SECRET="production-secret-key-min-32-chars-buraya"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

### Prisma Setup

```bash
# Prisma client generate
npm run db:generate

# Migration'ları uygula
npx prisma migrate deploy
```

**Not**: Production'da `migrate deploy` kullanın, `migrate dev` değil!

### Build

```bash
npm run build
```

## 4. Process Manager (PM2)

### PM2 Kurulumu

```bash
sudo npm install -g pm2
```

### PM2 ile Başlatma

```bash
cd /var/www/ops-portal
pm2 start npm --name "ops-portal" -- start
```

### PM2 Yapılandırması

`ecosystem.config.js` dosyası oluşturun:

```javascript
module.exports = {
  apps: [{
    name: 'ops-portal',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/ops-portal',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

Kullanım:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### PM2 Komutları

```bash
# Durumu kontrol et
pm2 status

# Logları görüntüle
pm2 logs ops-portal

# Yeniden başlat
pm2 restart ops-portal

# Durdur
pm2 stop ops-portal
```

## 5. Nginx Reverse Proxy

### Nginx Konfigürasyonu

```bash
sudo nano /etc/nginx/sites-available/ops-portal
```

İçerik:
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

### Nginx'i Aktifleştirin

```bash
sudo ln -s /etc/nginx/sites-available/ops-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6. SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kurun
sudo apt install certbot python3-certbot-nginx

# SSL sertifikası alın
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Otomatik yenileme test edin
sudo certbot renew --dry-run
```

## 7. Firewall Yapılandırması

```bash
# UFW kurun
sudo apt install ufw

# Kuralları ayarlayın
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Firewall'u aktifleştirin
sudo ufw enable
```

## 8. Monitoring ve Logging

### PM2 Monitoring

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Log Konumları

- **PM2 Logs**: `~/.pm2/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **PostgreSQL Logs**: `/var/log/postgresql/`

## 9. Backup Stratejisi

### Veritabanı Backup

```bash
# Backup script oluşturun
nano /usr/local/bin/backup-ops-portal.sh
```

İçerik:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ops-portal"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U opsportal opsportal > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Cron job ekleyin:
```bash
crontab -e
# Her gün saat 02:00'de backup al
0 2 * * * /usr/local/bin/backup-ops-portal.sh
```

## 10. Güncelleme Prosedürü

```bash
# 1. Backup alın
/usr/local/bin/backup-ops-portal.sh

# 2. Kodu güncelleyin
cd /var/www/ops-portal
git pull

# 3. Bağımlılıkları güncelleyin
npm install --production

# 4. Prisma client generate
npm run db:generate

# 5. Migration'ları uygulayın
npx prisma migrate deploy

# 6. Build
npm run build

# 7. PM2'yi yeniden başlatın
pm2 restart ops-portal
```

## 11. Sorun Giderme

### Uygulama Çalışmıyor

```bash
# PM2 durumunu kontrol edin
pm2 status

# Logları inceleyin
pm2 logs ops-portal --lines 100

# Port kullanımını kontrol edin
sudo netstat -tulpn | grep 3000
```

### Veritabanı Bağlantı Hatası

```bash
# PostgreSQL'in çalıştığını kontrol edin
sudo systemctl status postgresql

# Bağlantıyı test edin
psql -U opsportal -d opsportal -h localhost
```

### Nginx Hatası

```bash
# Nginx konfigürasyonunu test edin
sudo nginx -t

# Nginx loglarını kontrol edin
sudo tail -f /var/log/nginx/error.log
```

## 12. Performans Optimizasyonu

### Node.js Optimizasyonu

`.env` dosyasına ekleyin:
```env
NODE_OPTIONS="--max-old-space-size=1024"
```

### PostgreSQL Optimizasyonu

`/etc/postgresql/14/main/postgresql.conf` dosyasını düzenleyin:
```conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
```

## 13. Güvenlik Kontrol Listesi

- [ ] Güçlü database şifresi kullanıldı
- [ ] NEXTAUTH_SECRET güçlü ve rastgele
- [ ] HTTPS aktif
- [ ] Firewall yapılandırıldı
- [ ] SSH key authentication kullanılıyor
- [ ] Root login devre dışı
- [ ] Düzenli backup alınıyor
- [ ] Log rotation aktif
- [ ] Environment variables güvenli
- [ ] Production'da seed script çalıştırılmadı

## Destek

Sorun yaşarsanız:
1. Logları kontrol edin
2. SETUP.md dosyasına bakın
3. GitHub Issues'da arama yapın
