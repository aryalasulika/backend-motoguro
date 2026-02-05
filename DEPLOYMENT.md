# Panduan Deployment Backend ke VPS Ubuntu 24.04

Dokumen ini menjelaskan langkah-langkah untuk melakukan deployment aplikasi backend Motoguro ke VPS dengan sistem operasi Ubuntu 24.04.

## Prasyarat

- VPS dengan Ubuntu 24.04
- Akses SSH ke server (root atau user dengan hak `sudo`)
- Domain yang sudah diarahkan ke IP server (jika ingin menggunakan SSL/HTTPS)

## 1. Persiapan Server

Update sistem dan install paket-paket dasar yang diperlukan.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip build-essential
```

### Install Node.js (Versi 20 LTS disarankan)

Menggunakan NodeSource repository:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verifikasi instalasi:

```bash
node -v
npm -v
```

### Install PM2 (Process Manager)

PM2 digunakan untuk menjalankan aplikasi Node.js di background agar tetap berjalan meskipun terminal ditutup.

```bash
sudo npm install -g pm2
```

### Install PostgreSQL (Database)

Jika Anda menggunakan database terpisah (misal RBS/Managed DB), langkah ini bisa dilewati. Jika ingin install di server yang sama:

```bash
sudo apt install -y postgresql postgresql-contrib
```

Start service PostgreSQL:

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Buat database dan user baru (sesuaikan dengan `.env` Anda nanti):

```bash
sudo -u postgres psql
```

Dalam console PostgreSQL:

```sql
CREATE DATABASE motoguro_db;
CREATE USER motoguro_user WITH PASSWORD 'password_anda';
ALTER ROLE motoguro_user SET client_encoding TO 'utf8';
ALTER ROLE motoguro_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE motoguro_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE motoguro_db TO motoguro_user;
\q
```

## 2. Setup Project

Copy file project backend ke server (bisa via `git clone` atau upload manual/SCP). Asumsikan project ada di `/var/www/motoguro-backend`.

```bash
# Contoh jika menggunakan git
cd /var/www
sudo git clone https://github.com/username/motoguro-backend.git
cd motoguro-backend
```

### Install Dependencies

```bash
npm install
```

### Konfigurasi Environment Variables

Copy file `.env` contoh (jika ada) atau buat file `.env` baru.

```bash
cp .env.example .env
nano .env
```

Isi dengan konfigurasi production Anda:

```ini
DATABASE_URL=postgres://motoguro_user:password_anda@localhost:5432/motoguro_db
BETTER_AUTH_SECRET=rahasia_aman_anda
PORT=3000
BETTER_AUTH_BASE_URL=https://api.yourdomain.com
```

### Build Aplikasi

Karena Project menggunakan TypeScript, kita perlu melakukan build menjadi JavaScript.

```bash
# Install TypeScript secara global atau gunakan npx (sudah terinstall di devDependencies)
npx tsc
```

Script ini akan menghasilkan folder `dist` (sesuai `tsconfig.json`).

### Setup Database Schema (Drizzle)

Jalankan push schema untuk membuat tabel-tabel di database (pastikan `.env` sudah benar).

```bash
npx drizzle-kit push
# ATAU jika ingin generate migration file dulu
npx drizzle-kit generate
npx drizzle-kit migrate
```

## 3. Menjalankan Aplikasi dengan PM2

Jalankan aplikasi dari folder hasil build (`dist`).

```bash
pm2 start dist/index.js --name motoguro-backend
```

Simpan list process PM2 dan setup startup hook agar otomatis jalan saat restart server:

```bash
pm2 save
pm2 startup
# Copy dan jalankan command yang ditampilkan oleh output pm2 startup
```

## 4. Konfigurasi Nginx (Reverse Proxy)

Install Nginx untuk meneruskan traffic dari port 80/443 ke port aplikasi (3000).

```bash
sudo apt install -y nginx
```

Buat konfigurasi server block:

```bash
sudo nano /etc/nginx/sites-available/motoguro-backend
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com; # Ganti dengan domain Anda

    location / {
        proxy_pass http://localhost:3000; # Sesuaikan PORT di .env
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan konfigurasi:

```bash
sudo ln -s /etc/nginx/sites-available/motoguro-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. Setup SSL (HTTPS) dengan Certbot

Amankan koneksi dengan SSL Let's Encrypt gratis.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

Ikuti instruksi di layar. Certbot akan otomatis mengupdate konfigurasi Nginx Anda.

---

**Selesai!** Backend Anda sekarang seharusnya sudah berjalan di `https://api.yourdomain.com`.
