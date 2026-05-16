# Deployment Guide

This guide covers deploying both the frontend and backend of the LLM Security Gateway.

## Overview

**Backend (FastAPI)**
- Python 3.10+
- Runs on port 8000 (configurable)
- Needs spaCy NLP model
- CPU-based inference

**Frontend (React + Vite)**
- Node.js 18+
- Static files (can be served by any web server)
- Talks to backend via REST API

## Deployment Options

### Option 1: Docker Compose (Recommended for Development)

#### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    volumes:
      - ./config.yaml:/app/config.yaml
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:8000
    depends_on:
      - backend
```

#### Dockerfile.backend

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model
RUN python -m spacy download en_core_web_lg

# Copy application
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Dockerfile (Frontend)

```dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Serve with nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  # Cache static assets
  location ~* \.(js|css|woff2|woff|ttf|svg|png|jpg|jpeg)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }

  # API proxy (optional)
  location /api/ {
    proxy_pass http://backend:8000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # SPA routing
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

**Run:**

```bash
docker-compose up --build
```

Access at `http://localhost` (frontend) and `http://localhost:8000` (backend).

### Option 2: Kubernetes (Production)

#### backend-deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llm-security-gateway-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gateway-backend
  template:
    metadata:
      labels:
        app: gateway-backend
    spec:
      containers:
      - name: backend
        image: myregistry/llm-gateway-backend:1.0.0
        ports:
        - containerPort: 8000
        env:
        - name: PYTHONUNBUFFERED
          value: "1"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: gateway-backend-service
spec:
  selector:
    app: gateway-backend
  ports:
  - protocol: TCP
    port: 8000
    targetPort: 8000
  type: ClusterIP

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gateway-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: llm-security-gateway-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

#### frontend-deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llm-security-gateway-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gateway-frontend
  template:
    metadata:
      labels:
        app: gateway-frontend
    spec:
      containers:
      - name: frontend
        image: myregistry/llm-gateway-frontend:1.0.0
        ports:
        - containerPort: 80
        env:
        - name: VITE_API_BASE_URL
          value: "https://api.mygateway.com"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: gateway-frontend-service
spec:
  selector:
    app: gateway-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

**Deploy:**

```bash
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
```

### Option 3: Vercel (Frontend Only)

1. **Push code to GitHub**

2. **Connect to Vercel**
   - Go to https://vercel.com/new
   - Select repository
   - Click "Deploy"

3. **Set environment variables**
   - Go to Project Settings → Environment Variables
   - Add: `VITE_API_BASE_URL=https://your-backend-api.com`

4. **Configure CORS**
   - In `main.py`, update `allow_origins`:
   ```python
   allow_origins=[
       "https://your-project.vercel.app",
       "https://yourdomain.com",
   ]
   ```

**Cost:** Free tier available for small projects.

### Option 4: Heroku (Backend Only)

#### Procfile

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### runtime.txt

```
python-3.10.13
```

#### Deploy:

```bash
heroku login
heroku create my-llm-gateway
heroku buildpacks:add heroku/python
git push heroku main
heroku config:set PYTHONUNBUFFERED=1
```

**Cost:** $7+/month for dyno.

### Option 5: Self-Hosted (VPS)

#### Setup on Ubuntu/Debian:

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y python3.10 python3-pip nginx supervisor git

# Clone repository
git clone <your-repo>
cd LLM-Security-Gateway

# Setup backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_lg

# Setup frontend
cd frontend
npm install
npm run build
cd ..

# Configure nginx
sudo cp nginx-prod.conf /etc/nginx/sites-available/default
sudo nginx -s reload

# Configure supervisor for backend
sudo cp supervisor-backend.conf /etc/supervisor/conf.d/
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start gateway-backend
```

#### supervisor-backend.conf

```ini
[program:gateway-backend]
directory=/path/to/project
command=/path/to/project/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/gateway-backend.err.log
stdout_logfile=/var/log/gateway-backend.out.log
```

## Environment Configuration

### Backend (main.py)

```python
# For production, restrict CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://app.yourdomain.com",
    ],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)
```

### Frontend (VITE_API_BASE_URL)

**Development:** `/api` (proxied by Vite)  
**Production:** `https://api.yourdomain.com`

## SSL/TLS Setup

### Using Let's Encrypt with Certbot

```bash
sudo apt-get install certbot python3-certbot-nginx

# For yourdomain.com and api.yourdomain.com
sudo certbot certonly --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Update nginx.conf

```nginx
# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name yourdomain.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name yourdomain.com;

  ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

  # ... rest of nginx config
}
```

## Performance Optimization

### Backend

- **Caching:** Add Redis for Presidio model caching
- **Rate limiting:** Implement token bucket or sliding window
- **Connection pooling:** For database connections
- **Load balancing:** Use nginx upstream or AWS ALB

### Frontend

- **Code splitting:** Lazy load BatchAnalyzer on demand
- **Image optimization:** Use WebP format
- **Compression:** Enable gzip in nginx
- **CDN:** CloudFront, Cloudflare, or similar

### nginx Optimization

```nginx
# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;

# Cache headers
add_header Cache-Control "public, max-age=31536000, immutable";

# Security headers
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

## Monitoring & Logging

### Application Monitoring

```python
# In main.py, add structured logging
import logging
from pythonjsonlogger import jsonlogger

logger = logging.getLogger()
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)
```

### Infrastructure Monitoring

- **Prometheus:** Collect metrics
- **Grafana:** Visualize dashboards
- **ELK Stack:** Log aggregation
- **Sentry:** Error tracking
- **DataDog:** APM

## Rollback Procedure

```bash
# With Docker
docker-compose down
git checkout previous-version
docker-compose up --build

# With Kubernetes
kubectl rollout history deployment/gateway-backend
kubectl rollout undo deployment/gateway-backend
```

## Testing in Production

```bash
# Health check
curl https://api.yourdomain.com/health

# Sample analysis
curl -X POST https://api.yourdomain.com/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is the capital of France?"}'

# Frontend
curl https://yourdomain.com
```

## Scaling Considerations

- **Presidio NLP model:** Runs on CPU, memory-intensive (~2GB)
- **Horizontal scaling:** Easy with stateless FastAPI
- **Load balancing:** Route to multiple backend instances
- **Rate limiting:** Implement per-user or per-IP quotas
- **Caching:** Cache model predictions if prompts repeat

## Cost Estimation (AWS Example)

| Component | Instance | Qty | Cost/month |
|-----------|----------|-----|-----------|
| Backend | t3.medium EC2 | 3 | $90 |
| Database | RDS t3.micro | 1 | $30 |
| Frontend | CloudFront | - | $10 |
| Load Balancer | ALB | 1 | $16 |
| S3 storage | - | - | $5 |
| **Total** | | | **~$151** |

## Post-Deployment Checklist

- [ ] Health endpoints responding
- [ ] CORS configured correctly
- [ ] SSL/TLS certificate installed
- [ ] Database backups scheduled
- [ ] Monitoring alerts set up
- [ ] Rate limiting enabled
- [ ] Logs aggregated
- [ ] Load testing passed (100+ req/s)
- [ ] Disaster recovery plan documented
- [ ] Security headers configured

## Support

For deployment issues:
1. Check logs: `docker-compose logs -f`
2. Verify connectivity: `curl http://backend:8000/health`
3. Test API: Use `http://backend:8000/docs`
4. Check frontend build: `npm run build && npm run preview`
