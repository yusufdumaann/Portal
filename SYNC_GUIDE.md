# Yerel ve Sunucu Arasında Senkronizasyon Rehberi

Bu rehber, yerel geliştirme ortamınız ile Ubuntu sunucusu arasında dosya senkronizasyonu kurmak için en kolay yöntemleri içerir.

## Yöntem 1: Git ile Senkronizasyon (Önerilen - En Kolay)

### 1. Git Repository Oluşturma

**Yerel bilgisayarınızda:**

```bash
# Proje klasörüne git
cd C:\Users\DUMAN\Desktop\Portal

# Git repository başlat (eğer yoksa)
git init

# .gitignore dosyasını kontrol et (zaten var)
cat .gitignore

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "Initial commit"
```

### 2. Remote Repository Oluşturma

**Seçenek A: GitHub (Önerilen - Ücretsiz)**

1. GitHub'da yeni bir repository oluşturun: https://github.com/new
2. Repository adını girin (örn: `ops-portal`)
3. **Private** seçin (güvenlik için)
4. "Create repository" tıklayın

**Yerel bilgisayarınızda:**

```bash
# Remote ekle (URL'yi kendi repository'nizle değiştirin)
git remote add origin https://github.com/KULLANICI_ADI/ops-portal.git

# Dosyaları push et
git branch -M main
git push -u origin main
```

**Seçenek B: GitLab veya Bitbucket**

Aynı işlemi GitLab veya Bitbucket ile de yapabilirsiniz.

### 3. Sunucuda Repository'yi Clone Etme

**Ubuntu sunucunuzda:**

```bash
# Proje klasörüne git
cd /var/www

# Repository'yi clone et
git clone https://github.com/KULLANICI_ADI/ops-portal.git ops-portal

# Klasöre git
cd ops-portal

# Bağımlılıkları yükle
npm install --production

# .env dosyasını oluştur (sunucuya özel)
nano .env
# DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL gibi değerleri ekleyin

# Prisma client generate
npm run db:generate

# Migration'ları uygula
npm run db:migrate:deploy
```

### 4. Güncellemeleri Senkronize Etme

**Yerel bilgisayarınızda değişiklik yaptıktan sonra:**

```bash
# Değişiklikleri commit et
git add .
git commit -m "Açıklayıcı commit mesajı"

# GitHub'a push et
git push
```

**Ubuntu sunucunuzda güncellemeleri çekme:**

```bash
cd /var/www/ops-portal

# Son değişiklikleri çek
git pull

# Yeni bağımlılıklar varsa yükle
npm install --production

# Prisma client generate (schema değiştiyse)
npm run db:generate

# Yeni migration varsa uygula
npm run db:migrate:deploy

# Build (kod değiştiyse)
npm run build

# PM2'yi yeniden başlat
pm2 restart ops-portal
```

### 5. Otomatik Güncelleme Script'i (Opsiyonel)

**Sunucuda otomatik pull script'i oluşturun:**

```bash
# Script oluştur
nano /usr/local/bin/update-ops-portal.sh
```

İçerik:

```bash
#!/bin/bash
cd /var/www/ops-portal

echo "🔄 Güncellemeler çekiliyor..."
git pull

echo "📦 Bağımlılıklar kontrol ediliyor..."
npm install --production

echo "🔧 Prisma client generate ediliyor..."
npm run db:generate

echo "🗄️ Migration'lar kontrol ediliyor..."
npm run db:migrate:deploy

echo "🏗️ Build yapılıyor..."
npm run build

echo "🔄 PM2 yeniden başlatılıyor..."
pm2 restart ops-portal

echo "✅ Güncelleme tamamlandı!"
```

Script'i çalıştırılabilir yapın:

```bash
sudo chmod +x /usr/local/bin/update-ops-portal.sh
```

Kullanım:

```bash
update-ops-portal.sh
```

---

## Yöntem 2: rsync ile Senkronizasyon (Hızlı ve Güvenli)

### Windows'ta rsync Kurulumu

**Seçenek A: WSL (Windows Subsystem for Linux) - Önerilen**

```powershell
# WSL'de Ubuntu kur
wsl --install

# WSL'de rsync zaten var
```

**Seçenek B: Git Bash (rsync yok, alternatif gerekli)**

**Seçenek C: WinSCP veya FileZilla (GUI)**

### rsync ile Senkronizasyon

**Yerel bilgisayarınızda (WSL veya Linux):**

```bash
# Sunucuya senkronize et
rsync -avz --exclude 'node_modules' \
          --exclude '.next' \
          --exclude '.env' \
          --exclude '.git' \
          -e ssh \
          /mnt/c/Users/DUMAN/Desktop/Portal/ \
          user@sunucu-ip:/var/www/ops-portal/
```

**Otomatik rsync script'i:**

```bash
# Script oluştur
nano ~/sync-to-server.sh
```

İçerik:

```bash
#!/bin/bash
SERVER="user@sunucu-ip"
REMOTE_PATH="/var/www/ops-portal"
LOCAL_PATH="/mnt/c/Users/DUMAN/Desktop/Portal"

rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env' \
  --exclude '.git' \
  --exclude '*.log' \
  -e ssh \
  "$LOCAL_PATH/" \
  "$SERVER:$REMOTE_PATH/"

echo "✅ Senkronizasyon tamamlandı!"
echo "Sunucuda şu komutları çalıştırın:"
echo "  cd $REMOTE_PATH"
echo "  npm install --production"
echo "  npm run db:generate"
echo "  npm run build"
echo "  pm2 restart ops-portal"
```

Çalıştırılabilir yapın:

```bash
chmod +x ~/sync-to-server.sh
```

Kullanım:

```bash
~/sync-to-server.sh
```

---

## Yöntem 3: SCP ile Manuel Kopyalama

**Yerel bilgisayarınızda (PowerShell veya Git Bash):**

```bash
# Tüm projeyi kopyala (node_modules hariç)
scp -r -o "StrictHostKeyChecking=no" \
    --exclude node_modules \
    --exclude .next \
    --exclude .env \
    C:\Users\DUMAN\Desktop\Portal \
    user@sunucu-ip:/var/www/ops-portal
```

**Not**: SCP Windows'ta `--exclude` desteklemez, bu yüzden önce arşiv oluşturmanız gerekir.

**Alternatif - ZIP ile:**

```powershell
# PowerShell'de
Compress-Archive -Path "C:\Users\DUMAN\Desktop\Portal\*" -DestinationPath "portal.zip" -Force

# Sunucuya kopyala
scp portal.zip user@sunucu-ip:/tmp/

# Sunucuda aç
ssh user@sunucu-ip
cd /var/www/ops-portal
unzip -o /tmp/portal.zip
rm /tmp/portal.zip
```

---

## Yöntem 4: VS Code Remote SSH (Geliştirme İçin)

VS Code ile doğrudan sunucuda çalışabilirsiniz:

1. **VS Code'da Remote-SSH extension'ı kurun**
2. **SSH config dosyasını düzenleyin:**

```bash
# Windows: C:\Users\DUMAN\.ssh\config
Host myserver
    HostName sunucu-ip
    User kullanici-adi
    Port 22
    IdentityFile C:\Users\DUMAN\.ssh\id_rsa
```

3. **VS Code'da "Remote-SSH: Connect to Host" ile bağlanın**
4. **Sunucudaki klasörü açın:** `/var/www/ops-portal`

Artık VS Code'da doğrudan sunucudaki dosyaları düzenleyebilirsiniz!

---

## Güvenlik Önerileri

### 1. .env Dosyasını Git'e Eklemeyin

`.gitignore` dosyasında zaten var, kontrol edin:

```bash
cat .gitignore | grep .env
```

### 2. SSH Key Authentication Kullanın

**Yerel bilgisayarınızda SSH key oluşturun:**

```bash
# Windows Git Bash veya WSL'de
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

**Public key'i sunucuya kopyalayın:**

```bash
ssh-copy-id user@sunucu-ip
```

Artık şifre girmeden bağlanabilirsiniz.

### 3. Private Repository Kullanın

GitHub'da repository'yi **Private** yapın.

---

## Hızlı Başlangıç - Git Workflow

### İlk Kurulum

**Yerel:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/KULLANICI/ops-portal.git
git push -u origin main
```

**Sunucu:**
```bash
cd /var/www
git clone https://github.com/KULLANICI/ops-portal.git ops-portal
cd ops-portal
npm install --production
# .env dosyasını oluştur
npm run db:generate
npm run db:migrate:deploy
npm run build
pm2 start npm --name "ops-portal" -- start
```

### Günlük Kullanım

**Yerel (değişiklik yaptıktan sonra):**
```bash
git add .
git commit -m "Değişiklik açıklaması"
git push
```

**Sunucu (güncelleme için):**
```bash
cd /var/www/ops-portal
git pull
npm install --production
npm run db:generate
npm run build
pm2 restart ops-portal
```

---

## Önerilen Yöntem

**En kolay ve en yaygın yöntem: Git + GitHub**

✅ Ücretsiz  
✅ Güvenli (private repo)  
✅ Versiyon kontrolü  
✅ Kolay senkronizasyon  
✅ Backup (kodlarınız GitHub'da)  
✅ Birden fazla geliştirici desteği  

---

## Sorun Giderme

### Git push hatası

```bash
# Remote URL'i kontrol et
git remote -v

# Remote'u güncelle
git remote set-url origin https://github.com/KULLANICI/ops-portal.git
```

### SSH bağlantı hatası

```bash
# Bağlantıyı test et
ssh -v user@sunucu-ip

# SSH key'i kontrol et
ssh-add -l
```

### Permission denied

```bash
# Sunucuda klasör izinlerini kontrol et
ls -la /var/www/ops-portal

# Gerekirse sahipliği değiştir
sudo chown -R $USER:$USER /var/www/ops-portal
```
