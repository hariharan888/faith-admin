#!/bin/bash

set -e

echo "🔧 Setting up Faith Admin production infrastructure..."

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
echo ""

# Setup nginx container and kamal-proxy
echo "🔧 Setting up nginx container and kamal-proxy..."
ssh "${DEPLOY_SERVER_USER}@${DEPLOY_SERVER_IP}" << REMOTE_SCRIPT
set -e

# Create nginx config directory if not exists
mkdir -p ~/nginx-config

# Create nginx config for SPA
cat > ~/nginx-config/admin-default.conf << 'NGINX_CONF'
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    location /_next/static {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|js|css)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX_CONF

# Create the deployment directory
mkdir -p ${DEPLOY_SERVER_PATH}

# Remove old container if it exists with the old name
if sudo docker ps -a --format '{{.Names}}' | grep -q "^${OLD_CONTAINER_NAME}\$"; then
    echo "🗑️  Removing old container '${OLD_CONTAINER_NAME}'..."
    sudo docker rm -f ${OLD_CONTAINER_NAME} 2>/dev/null || true
    echo "✅ Old container removed"
fi

# Ensure placeholder index.html exists (needed for health check)
if [ ! -f "${DEPLOY_SERVER_PATH}/index.html" ]; then
    echo "Creating placeholder index.html for health check..."
    cat > ${DEPLOY_SERVER_PATH}/index.html << 'PLACEHOLDER'
<!DOCTYPE html>
<html>
<head><title>Faith Church Admin</title></head>
<body><h1>Setting up...</h1></body>
</html>
PLACEHOLDER
fi

# Check if nginx container already exists
if sudo docker ps -a --format '{{.Names}}' | grep -q "^${NGINX_CONTAINER_NAME}\$"; then
    echo "ℹ️  Nginx container '${NGINX_CONTAINER_NAME}' already exists"
    
    # Check if it's running
    if sudo docker ps --format '{{.Names}}' | grep -q "^${NGINX_CONTAINER_NAME}\$"; then
        echo "✅ Container is running"
        
        NEEDS_RECREATE=false
        
        # Verify it's configured correctly by checking if the volume mount is correct
        CONTAINER_PATH=\$(sudo docker inspect ${NGINX_CONTAINER_NAME} --format '{{range .Mounts}}{{if eq .Destination "/usr/share/nginx/html"}}{{.Source}}{{end}}{{end}}')
        if [ "\${CONTAINER_PATH}" != "${DEPLOY_SERVER_PATH}" ]; then
            echo "⚠️  Container exists but with different path (\${CONTAINER_PATH} vs ${DEPLOY_SERVER_PATH})"
            NEEDS_RECREATE=true
        fi
        
        # Check if port is bound to 127.0.0.1 (old configuration that won't work with kamal-proxy)
        # Inspect the port bindings to see if it's restricted to localhost
        PORT_HOST_IP=\$(sudo docker inspect ${NGINX_CONTAINER_NAME} --format '{{range \$p, \$conf := .HostConfig.PortBindings}}{{if eq \$p "80/tcp"}}{{range \$conf}}{{.HostIp}}{{end}}{{end}}{{end}}' 2>/dev/null | head -1)
        if [ "\${PORT_HOST_IP}" = "127.0.0.1" ] || [ "\${PORT_HOST_IP}" = "::1" ]; then
            echo "⚠️  Container is bound to \${PORT_HOST_IP} (not accessible to kamal-proxy)"
            NEEDS_RECREATE=true
        fi
        
        # Check if container is on the kamal network
        CONTAINER_NETWORK=\$(sudo docker inspect ${NGINX_CONTAINER_NAME} --format '{{range \$net, \$conf := .NetworkSettings.Networks}}{{if eq \$net "kamal"}}kamal{{end}}{{end}}' 2>/dev/null)
        if [ "\${CONTAINER_NETWORK}" != "kamal" ]; then
            echo "⚠️  Container is not on the 'kamal' network (required for kamal-proxy)"
            NEEDS_RECREATE=true
        fi
        
        if [ "\$NEEDS_RECREATE" = "true" ]; then
            echo "   Removing old container to recreate with correct configuration..."
            sudo docker rm -f ${NGINX_CONTAINER_NAME}
            
            echo "📦 Creating nginx container on kamal network..."
            sudo docker run -d \
                --name ${NGINX_CONTAINER_NAME} \
                --network kamal \
                --restart unless-stopped \
                -v ${DEPLOY_SERVER_PATH}:/usr/share/nginx/html:ro \
                -v ~/nginx-config/admin-default.conf:/etc/nginx/conf.d/default.conf:ro \
                nginx:alpine
            echo "✅ Nginx container recreated: ${NGINX_CONTAINER_NAME}"
        else
            echo "✅ Container is configured correctly"
            # Restart to ensure it picks up any config changes
            sudo docker restart ${NGINX_CONTAINER_NAME} > /dev/null 2>&1
        fi
    else
        echo "⚠️  Container exists but is not running, starting it..."
        sudo docker start ${NGINX_CONTAINER_NAME}
        echo "✅ Container started"
    fi
else
    # Create nginx container on the kamal network (same network as kamal-proxy)
    echo "📦 Creating nginx container on kamal network..."
    sudo docker run -d \
        --name ${NGINX_CONTAINER_NAME} \
        --network kamal \
        --restart unless-stopped \
        -v ${DEPLOY_SERVER_PATH}:/usr/share/nginx/html:ro \
        -v ~/nginx-config/admin-default.conf:/etc/nginx/conf.d/default.conf:ro \
        nginx:alpine

    echo "✅ Nginx container created: ${NGINX_CONTAINER_NAME}"
fi

# Wait for container to be ready
echo "⏳ Waiting for nginx container to be ready..."
sleep 3

# Verify container is running by checking via Docker
echo "🔍 Verifying nginx container is healthy..."
MAX_RETRIES=6
RETRY_COUNT=0
CONTAINER_READY=false

# Get the container's IP on the kamal network
CONTAINER_IP=\$(sudo docker inspect ${NGINX_CONTAINER_NAME} --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null)
echo "   Container IP on kamal network: \${CONTAINER_IP}"

while [ \$RETRY_COUNT -lt \$MAX_RETRIES ]; do
    # Test from inside the kamal network using kamal-proxy container
    if sudo docker exec kamal-proxy sh -c "wget -q -O /dev/null --timeout=5 http://${NGINX_CONTAINER_NAME}:80" 2>/dev/null; then
        echo "✅ Nginx container is responding on kamal network"
        CONTAINER_READY=true
        break
    else
        RETRY_COUNT=\$((RETRY_COUNT + 1))
        if [ \$RETRY_COUNT -lt \$MAX_RETRIES ]; then
            echo "   Waiting for container... (attempt \$RETRY_COUNT/\$MAX_RETRIES)"
            sleep 2
        fi
    fi
done

if [ "\$CONTAINER_READY" = "false" ]; then
    echo "⚠️  Could not verify container via Docker network, but continuing..."
fi

# Check if domain is already registered with kamal-proxy
if sudo docker exec kamal-proxy kamal-proxy list 2>/dev/null | grep -q "${DEPLOY_DOMAIN}"; then
    echo "ℹ️  Domain '${DEPLOY_DOMAIN}' is already registered with kamal-proxy"
    echo "✅ Skipping registration (already configured)"
else
    echo "🔗 Registering domain with kamal-proxy..."
    # Register with kamal-proxy using container name (Docker DNS on kamal network)
    # This is how Kamal registers the Rails app - using container:port
    if sudo docker exec kamal-proxy kamal-proxy deploy ${NGINX_CONTAINER_NAME} \
        --target "${NGINX_CONTAINER_NAME}:80" \
        --host "${DEPLOY_DOMAIN}" \
        --tls 2>&1; then
        echo "✅ Domain registered: ${DEPLOY_DOMAIN}"
        echo "   Target: ${NGINX_CONTAINER_NAME}:80"
        echo "   SSL certificate will be provisioned automatically by kamal-proxy"
    else
        echo "⚠️  Registration encountered an issue, checking status..."
        sleep 2
        # Check if domain was actually registered despite the error
        if sudo docker exec kamal-proxy kamal-proxy list 2>/dev/null | grep -q "${DEPLOY_DOMAIN}"; then
            echo "✅ Domain was registered successfully"
            echo "   SSL certificate will be provisioned automatically by kamal-proxy"
        else
            echo "❌ Registration failed."
            echo ""
            echo "📋 Troubleshooting:"
            echo "   1. Check if kamal network exists: sudo docker network ls | grep kamal"
            echo "   2. Check container is on network: sudo docker inspect ${NGINX_CONTAINER_NAME} --format '{{.NetworkSettings.Networks}}'"
            echo "   3. Test connectivity: sudo docker exec kamal-proxy wget -q -O- http://${NGINX_CONTAINER_NAME}:80"
            echo ""
            echo "   Manual registration command:"
            echo "   sudo docker exec kamal-proxy kamal-proxy deploy ${NGINX_CONTAINER_NAME} --target ${NGINX_CONTAINER_NAME}:80 --host ${DEPLOY_DOMAIN} --tls"
        fi
    fi
fi
REMOTE_SCRIPT

echo ""
echo "✅ Production infrastructure setup completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Run ./scripts/deploy-production.sh to deploy your application"
echo "   2. Wait a few minutes for SSL certificate to be provisioned"
echo "   3. Visit https://${DEPLOY_DOMAIN} to verify"

