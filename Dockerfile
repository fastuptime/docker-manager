# Multi-stage build için Node.js base image
FROM node:18-alpine AS builder

# Çalışma dizini
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Dependencies yükle
RUN npm ci --only=production

# Production stage
FROM node:18-alpine

# Güvenlik için non-root user oluştur
RUN addgroup -g 1001 -S nodejs
RUN adduser -S dockermanager -u 1001

# Çalışma dizini
WORKDIR /app

# Builder stage'den node_modules kopyala
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=dockermanager:nodejs . .

# Logs dizini oluştur
RUN mkdir -p logs && chown dockermanager:nodejs logs

# Port expose et
EXPOSE 3000

# Non-root user'a geç
USER dockermanager

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/system/info || exit 1

# Uygulamayı başlat
CMD ["node", "backend/server.js"]
