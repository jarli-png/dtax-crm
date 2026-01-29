#!/bin/bash
# ==============================================
# dTax CRM - Deploy Script for EC2
# ==============================================

set -e

echo "=========================================="
echo "  dTax CRM - Deployment til AWS EC2"
echo "=========================================="

# Variabler
APP_NAME="dtax-crm"
APP_DIR="/home/ubuntu/$APP_NAME"
REPO_URL="https://github.com/dtax-lier/dtax-crm.git"

# Sjekk at vi kjører som root eller med sudo
if [ "$EUID" -ne 0 ]; then 
  echo "Kjør dette scriptet med sudo"
  exit 1
fi

echo ""
echo "[1/7] Oppdaterer system..."
apt-get update -y
apt-get upgrade -y

echo ""
echo "[2/7] Installerer Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo ""
echo "[3/7] Installerer PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Opprett database og bruker
sudo -u postgres psql << EOF
CREATE USER dtax_crm WITH PASSWORD 'secure_password_change_me';
CREATE DATABASE dtax_crm OWNER dtax_crm;
GRANT ALL PRIVILEGES ON DATABASE dtax_crm TO dtax_crm;
EOF

echo ""
echo "[4/7] Installerer Nginx..."
apt-get install -y nginx

echo ""
echo "[5/7] Konfigurerer Nginx..."
cat > /etc/nginx/sites-available/$APP_NAME << 'NGINX'
server {
    listen 80;
    server_name crm.dtax.no;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "[6/7] Setter opp applikasjon..."
mkdir -p $APP_DIR
cd $APP_DIR

# Opprett .env fil
cat > .env << 'ENV'
# Database
DATABASE_URL="postgresql://dtax_crm:secure_password_change_me@localhost:5432/dtax_crm"

# AWS
AWS_REGION="eu-north-1"
AWS_ACCESS_KEY_ID="REPLACE_WITH_ACCESS_KEY"
AWS_SECRET_ACCESS_KEY="REPLACE_WITH_SECRET_KEY"

# S3
S3_BUCKET="dtax-crm-documents"

# E-post (AWS SES)
FROM_EMAIL="noreply@dtax.no"
BCC_EMAIL="arkiv@dtax.no"

# Integrasjoner
TAX_SYSTEM_URL="https://tax.salestext.no"
TAX_SYSTEM_API_KEY="REPLACE_WITH_API_KEY"

INVOICE_SYSTEM_URL="https://invoice.dtax.no"
INVOICE_SYSTEM_API_KEY="REPLACE_WITH_API_KEY"

# Auth
JWT_SECRET="REPLACE_WITH_32_CHAR_SECRET"
NEXTAUTH_SECRET="REPLACE_WITH_NEXTAUTH_SECRET"
NEXTAUTH_URL="https://crm.dtax.no"
ENV

echo ""
echo "[7/7] Installerer PM2 for prosessadministrasjon..."
npm install -g pm2

echo ""
echo "=========================================="
echo "  VIKTIG: Manuelle steg som gjenstår"
echo "=========================================="
echo ""
echo "1. Last opp applikasjonskoden til $APP_DIR"
echo "   scp -r ./dtax-crm/* ubuntu@IP:$APP_DIR/"
echo ""
echo "2. Oppdater .env filen med riktige verdier:"
echo "   nano $APP_DIR/.env"
echo ""
echo "3. Installer dependencies og bygg:"
echo "   cd $APP_DIR"
echo "   npm install"
echo "   npx prisma generate"
echo "   npx prisma db push"
echo "   npm run build"
echo ""
echo "4. Start applikasjonen:"
echo "   pm2 start npm --name 'dtax-crm' -- start"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "5. Installer SSL med Certbot:"
echo "   apt-get install -y certbot python3-certbot-nginx"
echo "   certbot --nginx -d crm.dtax.no"
echo ""
echo "6. Sett opp DNS i Domeneshop:"
echo "   Type: A"
echo "   Host: crm"
echo "   Value: <EC2 Public IP>"
echo ""
echo "=========================================="
echo "  Deploy-script fullført!"
echo "=========================================="
