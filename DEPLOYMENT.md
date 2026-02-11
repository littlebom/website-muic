# MUIC Web Application - Deployment Guide

คู่มือการติดตั้ง Web Application บน Production Server

## 📋 ข้อมูลเบื้องต้น

| รายการ | ค่า |
|--------|-----|
| **Server** | Google VM `instance-crm` |
| **Zone** | `asia-east1-c` |
| **IP Address** | `35.194.244.162` |
| **OS** | Ubuntu 24.04.3 LTS |
| **Domain** | `muic.lifeskill.in.th` |
| **Application Port** | 3000 (internal) |
| **NPM Admin Port** | 81 |

---

## 🔧 Prerequisites

### 1. ติดตั้ง Docker และ Docker Compose บน Server

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 2. เปิด Firewall Ports

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 81/tcp
sudo ufw reload
```

---

## 📁 โครงสร้างไฟล์บน Server

```
~/web-muic-clean/
├── app/                    # Source code (extracted from tar.gz)
│   ├── Dockerfile
│   ├── package.json
│   └── ...
├── uploads/                # User uploaded files (mounted volume)
│   ├── banners/
│   ├── courses/
│   ├── institutions/
│   ├── instructors/
│   ├── news/
│   ├── others/
│   └── squares/
└── docker-compose.yml      # Docker Compose configuration
```

---

## 📄 docker-compose.yml

สร้างไฟล์ `docker-compose.yml` ใน `~/web-muic-clean/`:

```yaml
version: '3.8'

services:
  web-muic:
    image: web-muic-clean:latest
    container_name: web-muic-clean
    restart: unless-stopped
    environment:
      - DATABASE_URL=mysql://root:YOUR_DB_PASSWORD@db:3306/web_muicclean
      - NODE_ENV=production
    volumes:
      - ./uploads:/app/public/uploads
    networks:
      - proxy-network
    depends_on:
      - db

  db:
    image: mysql:8.0
    container_name: web-muic-db
    restart: unless-stopped
    environment:
      - MYSQL_ROOT_PASSWORD=YOUR_DB_PASSWORD
      - MYSQL_DATABASE=web_muicclean
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - proxy-network

  npm:
    image: jc21/nginx-proxy-manager:latest
    container_name: nginx-proxy-manager
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - npm_data:/data
      - npm_letsencrypt:/etc/letsencrypt
    networks:
      - proxy-network

volumes:
  mysql_data:
  npm_data:
  npm_letsencrypt:

networks:
  proxy-network:
    driver: bridge
```

> ⚠️ **สำคัญ**: แทนที่ `YOUR_DB_PASSWORD` ด้วยรหัสผ่านจริง

---

## 🚀 ขั้นตอนการ Deploy

### Step 1: SSH เข้า Server

```bash
gcloud compute ssh instance-crm --zone=asia-east1-c
```

### Step 2: สร้างโครงสร้าง Directory

```bash
mkdir -p ~/web-muic-clean/app
mkdir -p ~/web-muic-clean/uploads
cd ~/web-muic-clean
```

### Step 3: สร้าง docker-compose.yml

```bash
nano docker-compose.yml
# วาง content จากด้านบน แล้วบันทึก
```

### Step 4: Upload Source Code จาก Local

**บน Local Machine:**

```bash
# Package source code (exclude node_modules, .next, .git)
cd /path/to/web-muic-clean
tar --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='.DS_Store' -czf /tmp/web-muic-clean.tar.gz .

# Upload to server
gcloud compute scp /tmp/web-muic-clean.tar.gz instance-crm:~/web-muic-clean/app.tar.gz --zone=asia-east1-c
```

### Step 5: Extract และ Build Docker Image บน Server

```bash
# SSH to server
gcloud compute ssh instance-crm --zone=asia-east1-c

# Extract source code
cd ~/web-muic-clean/app
tar -xzf ~/web-muic-clean/app.tar.gz

# Build Docker image
docker build -t web-muic-clean:latest .
```

### Step 6: Start Services

```bash
cd ~/web-muic-clean
docker compose up -d
```

### Step 7: Import Database

**บน Local Machine:**

```bash
# Export database
mysqldump -u root -p web_muicclean > /tmp/web_muicclean.sql

# Upload to server
gcloud compute scp /tmp/web_muicclean.sql instance-crm:~ --zone=asia-east1-c
```

**บน Server:**

```bash
# Wait for MySQL to be ready (wait ~10 seconds after docker compose up)
docker exec -i web-muic-db mysql -u root -pYOUR_DB_PASSWORD web_muicclean < ~/web_muicclean.sql
```

### Step 8: Upload Images/Uploads

**บน Local Machine:**

```bash
# Package uploads folder
cd /path/to/web-muic-clean/public
tar -czf /tmp/uploads.tar.gz uploads

# Upload to server
gcloud compute scp /tmp/uploads.tar.gz instance-crm:~/web-muic-clean/ --zone=asia-east1-c
```

**บน Server:**

```bash
cd ~/web-muic-clean
sudo rm -rf uploads
sudo tar -xzf uploads.tar.gz
sudo chown -R 1001:1001 uploads
docker restart web-muic-clean
```

---

## 🔐 Configure Nginx Proxy Manager (SSL)

### Step 1: Access NPM Admin

เปิด Browser ไปที่: `http://35.194.244.162:81`

**Default Login:**
- Email: `admin@example.com`
- Password: `changeme`

### Step 2: Add Proxy Host

1. ไปที่ **Proxy Hosts** → **Add Proxy Host**
2. กรอกข้อมูล:
   - **Domain Names**: `muic.lifeskill.in.th`
   - **Scheme**: `http`
   - **Forward Hostname / IP**: `web-muic-clean`
   - **Forward Port**: `3000`
   - ✅ **Block Common Exploits**
   - ✅ **Websockets Support**

3. Tab **SSL**:
   - Select: **Request a new SSL Certificate**
   - ✅ **Force SSL**
   - ✅ **HTTP/2 Support**
   - Email: `your-email@example.com`
   - ✅ **I Agree to...**

4. Click **Save**

---

## 🔄 การ Update Application

เมื่อมีการแก้ไขโค้ดและต้องการ deploy ใหม่:

### Quick Update Commands (บน Local):

```bash
# 1. Package and upload
cd /path/to/web-muic-clean
tar --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='.DS_Store' -czf /tmp/web-muic-clean.tar.gz .
gcloud compute scp /tmp/web-muic-clean.tar.gz instance-crm:~/web-muic-clean/app.tar.gz --zone=asia-east1-c
```

### Quick Update Commands (บน Server):

```bash
# 2. Extract, rebuild, and restart
cd ~/web-muic-clean/app && rm -rf * && tar -xzf ~/web-muic-clean/app.tar.gz
docker build -t web-muic-clean:latest .
cd ~/web-muic-clean && docker compose up -d --force-recreate web-muic
```

---

## 🛠️ Useful Commands

### Check Container Status

```bash
docker ps
docker logs web-muic-clean
docker logs web-muic-db
docker logs nginx-proxy-manager
```

### Restart Containers

```bash
docker restart web-muic-clean
docker restart web-muic-db
docker restart nginx-proxy-manager
```

### Stop All Services

```bash
cd ~/web-muic-clean
docker compose down
```

### Access MySQL CLI

```bash
docker exec -it web-muic-db mysql -u root -p
```

### View Container Logs (Live)

```bash
docker logs -f web-muic-clean
```

### Cleanup Docker (Remove unused images)

```bash
docker system prune -a
```

---

## 📊 Monitoring

### Check Disk Usage

```bash
df -h
docker system df
```

### Check Memory Usage

```bash
free -h
docker stats
```

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| **Website** | https://muic.lifeskill.in.th/ |
| **Admin Login** | https://muic.lifeskill.in.th/admin/login |
| **NPM Admin** | http://35.194.244.162:81 |

---

## 📝 Environment Variables

ตัวแปรสำคัญที่ใช้ใน Docker:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL connection string |
| `NODE_ENV` | `production` |
| `MYSQL_ROOT_PASSWORD` | MySQL root password |
| `MYSQL_DATABASE` | Database name (`web_muicclean`) |

---

## 🆘 Troubleshooting

### Container ไม่ Start

```bash
docker logs web-muic-clean
```

### Database Connection Error

1. ตรวจสอบว่า MySQL container running
2. ตรวจสอบ DATABASE_URL ใน docker-compose.yml
3. รอ ~10 วินาที หลัง docker compose up ก่อน web app จะ connect ได้

### Images ไม่แสดง

1. ตรวจสอบ uploads folder มี permission ถูกต้อง
2. restart container หลังจาก upload files

```bash
sudo chown -R 1001:1001 ~/web-muic-clean/uploads
docker restart web-muic-clean
```

### SSL Certificate ไม่ทำงาน

1. ตรวจสอบ DNS A record ชี้ไป IP ที่ถูกต้อง
2. ตรวจสอบ port 80 และ 443 เปิดอยู่
3. Re-request certificate ใน NPM Admin

---

*Last Updated: 2026-02-02*
