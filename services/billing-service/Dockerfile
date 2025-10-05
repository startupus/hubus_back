# ===========================================
# BILLING SERVICE DOCKERFILE
# Оптимизирован для Docker-контейнеров
# ===========================================

FROM node:18-alpine AS base

# Установить системные зависимости
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client \
    openssl \
    libssl3 \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# ===========================================
# DEVELOPMENT STAGE
# ===========================================
FROM base AS development

# Копировать package.json файлы
COPY package*.json ./
COPY services/shared/package*.json ./services/shared/
COPY services/billing-service/package*.json ./services/billing-service/

# Установить зависимости
RUN npm ci --only=production --silent
RUN cd services/shared && npm ci --silent
RUN cd services/billing-service && npm ci --silent

# Копировать исходный код
COPY services/shared ./services/shared
COPY services/billing-service ./services/billing-service

# Создать символическую ссылку на shared пакет
RUN ln -sf /app/services/shared /app/services/billing-service/node_modules/@ai-aggregator/shared

# Собрать shared пакет
RUN cd services/shared && npm run build

# Сгенерировать Prisma клиент
RUN cd services/billing-service && npx prisma generate

# Собрать billing-service
RUN cd services/billing-service && npm run build

# ===========================================
# PRODUCTION STAGE
# ===========================================
FROM base AS production

# Создать пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Копировать package.json файлы
COPY services/billing-service/package*.json ./

# Установить только production зависимости
RUN npm ci --only=production --silent && npm cache clean --force

# Копировать собранные файлы из development stage
COPY --from=development --chown=nestjs:nodejs /app/services/billing-service/dist ./dist
COPY --from=development --chown=nestjs:nodejs /app/services/shared ./shared
COPY --from=development --chown=nestjs:nodejs /app/services/billing-service/proto ./proto
COPY --from=development --chown=nestjs:nodejs /app/services/billing-service/prisma ./prisma

# Создать символическую ссылку на shared пакет
RUN ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Переустановить bcrypt для текущей архитектуры
RUN cd /app/shared && npm uninstall bcrypt && npm install bcrypt

# Сгенерировать Prisma клиент для production
RUN npx prisma generate

# Создать директории для логов
RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app/logs

# Переключиться на пользователя nestjs
USER nestjs

# Открыть порты
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Запустить приложение
CMD ["node", "dist/main"]
