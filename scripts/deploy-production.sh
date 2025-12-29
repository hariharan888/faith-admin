#!/bin/bash

set -e

echo "🚀 Starting Faith Admin production deployment..."

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Load production environment variables
if [ -f ".env.production" ]; then
    echo "📋 Loading production environment variables..."
    set -a
    source .env.production
    set +a
else
    echo "❌ .env.production file not found!"
    echo "Please create .env.production with your production environment variables"
    echo "Use env.production.example as a template"
    exit 1
fi

# Verify required environment variables
required_vars=("DEPLOY_SERVER_IP" "DEPLOY_SERVER_USER" "DEPLOY_SERVER_PATH" "DEPLOY_DOMAIN")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Optional: nginx container port (default 8080)
NGINX_PORT="${DEPLOY_NGINX_PORT:-8080}"
NGINX_CONTAINER_NAME="${DEPLOY_NGINX_CONTAINER:-faith-admin-nginx}"
OLD_CONTAINER_NAME="admin-nginx"

echo "✅ Environment variables loaded successfully"
echo "🌐 Server: ${DEPLOY_SERVER_USER}@${DEPLOY_SERVER_IP}"
echo "📁 Deploy Path: ${DEPLOY_SERVER_PATH}"
echo "🔗 Domain: ${DEPLOY_DOMAIN}"

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "📦 pnpm not found, using npm..."
    PACKAGE_MANAGER="npm"
else
    PACKAGE_MANAGER="pnpm"
fi

# Install dependencies
echo "📦 Installing dependencies..."
$PACKAGE_MANAGER install

# Build the static SPA
echo "🔨 Building static SPA..."
$PACKAGE_MANAGER run build

# Verify build output
if [ ! -d "out" ]; then
    echo "❌ Build failed - 'out' directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Create the deployment directory on server if it doesn't exist
echo "📂 Preparing server directory..."
ssh "${DEPLOY_SERVER_USER}@${DEPLOY_SERVER_IP}" "mkdir -p ${DEPLOY_SERVER_PATH}"

# Deploy using rsync
echo "📤 Uploading files to server..."
rsync -avz --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.env*' \
    out/ \
    "${DEPLOY_SERVER_USER}@${DEPLOY_SERVER_IP}:${DEPLOY_SERVER_PATH}/"

# Set proper permissions
echo "🔐 Setting file permissions..."
ssh "${DEPLOY_SERVER_USER}@${DEPLOY_SERVER_IP}" "chmod -R 755 ${DEPLOY_SERVER_PATH}"

# Restart nginx container to pick up new files
echo "🔄 Restarting nginx container to serve updated files..."
ssh "${DEPLOY_SERVER_USER}@${DEPLOY_SERVER_IP}" << REMOTE_SCRIPT
set -e

# Remove old container if it exists with the old name
if sudo docker ps -a --format '{{.Names}}' | grep -q "^${OLD_CONTAINER_NAME}\$"; then
    echo "🗑️  Removing old container '${OLD_CONTAINER_NAME}'..."
    sudo docker rm -f ${OLD_CONTAINER_NAME} 2>/dev/null || true
    echo "✅ Old container removed"
fi

# Check if nginx container exists
if ! sudo docker ps -a --format '{{.Names}}' | grep -q "^${NGINX_CONTAINER_NAME}\$"; then
    echo "❌ Nginx container '${NGINX_CONTAINER_NAME}' not found!"
    echo "   Please run ./scripts/setup-production.sh first to set up infrastructure"
    exit 1
fi

# Restart container to pick up new files
echo "Restarting nginx container..."
sudo docker restart ${NGINX_CONTAINER_NAME}
REMOTE_SCRIPT

echo "✅ Nginx container restarted"

# Health check
echo "🔍 Verifying deployment..."
DEPLOY_URL="https://${DEPLOY_DOMAIN}"
sleep 5

if curl -sf "${DEPLOY_URL}" > /dev/null 2>&1; then
    echo "✅ Deployment verified - site is accessible"
else
    echo "⚠️  Health check could not verify site (SSL may take a minute to provision)"
    echo "    URL: ${DEPLOY_URL}"
fi

echo ""
echo "✅ Production deployment completed!"
echo ""
echo "🌐 Your application is now live!"
echo "🔗 URL: ${DEPLOY_URL}"
echo ""
echo "📝 Post-deployment checklist:"
echo "   - Verify the site loads correctly"
echo "   - Test authentication flows"
echo "   - Check API connectivity"
echo "   - Verify SSL certificate is valid"

