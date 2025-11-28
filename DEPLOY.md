# Spider Admin - Deployment Guide

## Overview

Spider Admin is a React-based admin console with an Express BFF (Backend for Frontend) server that proxies requests to a backend API.

## Prerequisites

- Node.js 20 or higher
- npm or compatible package manager
- Backend API server running (default: http://localhost:7071)
- PM2 (optional, but recommended for production)

## Quick Start

### 1. Package the Application

On your development machine:

```bash
npm run deploy:package
```

This creates `spideradmin-deploy.tar.gz` containing:
- Built frontend assets (`dist/`)
- BFF server (`server/`)
- Dependencies configuration
- Production environment template

### 2. Upload to Server

Transfer the package to your production server:

```bash
scp spideradmin-deploy.tar.gz user@your-server:/opt/spideradmin/
```

### 3. Extract and Install

On the production server:

```bash
cd /opt/spideradmin
tar -xzf spideradmin-deploy.tar.gz
npm ci --omit=dev
```

### 4. Configure Environment

Create `.env.production` in the deployment directory:

```env
# Backend API Configuration
BACKEND_BASE_URL=http://your-backend-api:7071
BACKEND_API_TOKEN=your-backend-auth-token

# BFF Server Configuration
BFF_PORT=4000

# Optional: Dev Auth Gate (recommended for non-production environments)
BFF_DEV_AUTH_TOKEN=your-secure-token-here
BFF_DEV_AUTH_HEADER_NAME=x-admin-ui-token
```

**Environment Variables Explained:**

- `BACKEND_BASE_URL`: URL of your backend API (Spring Boot or similar)
- `BACKEND_API_TOKEN`: Authentication token for backend API requests
- `BFF_PORT`: Port for the BFF server (default: 4000)
- `BFF_DEV_AUTH_TOKEN`: (Optional) Token required in request headers for all non-health endpoints
- `BFF_DEV_AUTH_HEADER_NAME`: (Optional) Header name for dev auth (default: `x-admin-ui-token`)

### 5. Start the Application

#### Option A: Direct Node (Development/Testing)

```bash
NODE_ENV=production node server/index.cjs
```

#### Option B: PM2 (Recommended for Production)

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start the application
pm2 start server/index.cjs --name spideradmin -i max

# Save PM2 configuration
pm2 save

# Setup auto-start on system reboot
pm2 startup
```

**Useful PM2 Commands:**

```bash
pm2 list                    # List all processes
pm2 logs spideradmin        # View logs
pm2 restart spideradmin     # Restart application
pm2 stop spideradmin        # Stop application
pm2 delete spideradmin      # Remove from PM2
pm2 monit                   # Monitor resources
```

### 6. Verify Deployment

Check the health endpoint:

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "ok": true,
  "backend": "http://your-backend-api:7071"
}
```

## Access the Application

The admin UI will be available at:
- Local: `http://localhost:4000`
- Production: `http://your-domain:4000` (or configured port)

## Nginx Reverse Proxy (Recommended)

For production deployments, use Nginx as a reverse proxy with SSL:

### Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

### Configure Nginx

Create `/etc/nginx/sites-available/spideradmin`:

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/admin.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Logging
    access_log /var/log/nginx/spideradmin-access.log;
    error_log /var/log/nginx/spideradmin-error.log;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:4000;
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
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/spideradmin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d admin.yourdomain.com
```

## Docker Deployment (Optional)

### Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application
COPY dist/ ./dist/
COPY server/ ./server/

# Expose port
EXPOSE 4000

# Set production environment
ENV NODE_ENV=production

# Start application
CMD ["node", "server/index.cjs"]
```

### Create .dockerignore

```
node_modules
npm-debug.log
.env.development
.git
.gitignore
README.md
dist
deploy
scripts
src
```

### Build and Run

```bash
# Build the application first
npm run build

# Build Docker image
docker build -t spideradmin:latest .

# Run container
docker run -d \
  --name spideradmin \
  -p 4000:4000 \
  -e BACKEND_BASE_URL=http://backend-api:7071 \
  -e BACKEND_API_TOKEN=your-token \
  -e BFF_PORT=4000 \
  --restart unless-stopped \
  spideradmin:latest
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  spideradmin:
    image: spideradmin:latest
    container_name: spideradmin
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - BACKEND_BASE_URL=http://backend-api:7071
      - BACKEND_API_TOKEN=${BACKEND_API_TOKEN}
      - BFF_PORT=4000
      - BFF_DEV_AUTH_TOKEN=${BFF_DEV_AUTH_TOKEN}
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

Run with:
```bash
docker-compose up -d
```

## Monitoring and Logs

### PM2 Logs

```bash
pm2 logs spideradmin --lines 100
pm2 logs spideradmin --err  # Error logs only
```

### Direct Node Logs

Redirect to file:
```bash
NODE_ENV=production node server/index.cjs > /var/log/spideradmin/app.log 2>&1
```

### Docker Logs

```bash
docker logs spideradmin
docker logs -f spideradmin  # Follow logs
```

## Troubleshooting

### Application Won't Start

1. Check Node.js version: `node --version` (should be 20+)
2. Verify environment variables in `.env.production`
3. Check port availability: `lsof -i :4000`
4. Review logs for errors

### Backend Connection Issues

1. Verify `BACKEND_BASE_URL` is accessible from server
2. Test backend health: `curl http://your-backend:7071/health`
3. Check `BACKEND_API_TOKEN` is correct
4. Review BFF proxy logs

### 401 Unauthorized Errors

1. Check if `BFF_DEV_AUTH_TOKEN` is set
2. Ensure client sends correct header: `x-admin-ui-token`
3. If not needed, unset `BFF_DEV_AUTH_TOKEN` in environment

### High Memory Usage

```bash
# Restart PM2 process
pm2 restart spideradmin

# Monitor memory
pm2 monit
```

## Security Recommendations

1. **Use HTTPS**: Always use SSL/TLS in production (Nginx + Let's Encrypt)
2. **Firewall**: Restrict port 4000 to localhost, expose only via Nginx
3. **Environment Variables**: Never commit `.env.production` to version control
4. **Auth Tokens**: Use strong, randomly generated tokens
5. **Updates**: Keep Node.js and dependencies updated
6. **Access Control**: Use `BFF_DEV_AUTH_TOKEN` for additional security layer

## Updating the Application

1. Package new version on development machine:
   ```bash
   npm run deploy:package
   ```

2. Upload to server and extract to new directory

3. Stop current application:
   ```bash
   pm2 stop spideradmin
   ```

4. Replace files or switch directory

5. Install dependencies:
   ```bash
   npm ci --omit=dev
   ```

6. Restart application:
   ```bash
   pm2 restart spideradmin
   ```

## Performance Optimization

### PM2 Cluster Mode

Run multiple instances for load balancing:

```bash
pm2 start server/index.cjs --name spideradmin -i 4  # 4 instances
pm2 start server/index.cjs --name spideradmin -i max  # CPU count
```

### Nginx Caching

Add to Nginx config:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    proxy_pass http://localhost:4000;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Support

For issues and questions:
- Check application logs
- Review environment configuration
- Verify backend API connectivity
- Consult server health endpoint: `/health`

## Architecture

```
Client Browser
      ↓
   Nginx (SSL, Port 80/443)
      ↓
   BFF Server (Port 4000)
      ↓ /bff/* → /api/public/*
   Backend API (Port 7071)
```

The BFF (Backend for Frontend) server:
- Serves static frontend assets
- Proxies API requests to backend
- Injects authentication tokens
- Provides dev auth gate (optional)
