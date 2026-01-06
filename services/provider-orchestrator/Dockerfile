FROM node:18-alpine AS development

# Установить зависимости для Prisma и bcrypt
RUN apk add --no-cache openssl python3 make g++

# Настроить npm для увеличения таймаутов и retry
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

WORKDIR /app

# Копировать shared пакет
COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install --legacy-peer-deps || npm install --legacy-peer-deps || npm install --legacy-peer-deps
RUN npm run build

# Копировать provider-orchestrator (только нужные файлы)
WORKDIR /app
COPY services/provider-orchestrator/package*.json ./
RUN npm install --legacy-peer-deps || npm install --legacy-peer-deps || npm install --legacy-peer-deps
COPY services/provider-orchestrator/src ./src
COPY services/provider-orchestrator/prisma ./prisma
COPY services/provider-orchestrator/tsconfig*.json ./

# Создать директорию для символической ссылки и создать ссылку на shared пакет
RUN mkdir -p /app/node_modules/@ai-aggregator && \
    ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Сгенерировать Prisma клиент (если используется)
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate; fi

RUN npm run build

FROM node:18-alpine AS production

# Установить зависимости для Prisma и bcrypt
RUN apk add --no-cache openssl python3 make g++

# Настроить npm для увеличения таймаутов и retry
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

WORKDIR /app

COPY services/provider-orchestrator/package*.json ./
RUN npm install --legacy-peer-deps --only=production || npm install --legacy-peer-deps --only=production || npm install --legacy-peer-deps --only=production

COPY --from=development /app/dist ./dist
COPY --from=development /app/shared ./shared
# Копируем prisma из development stage
COPY --from=development /app/prisma ./prisma

# Создать директорию для символической ссылки и создать ссылку на shared пакет
RUN mkdir -p /app/node_modules/@ai-aggregator && \
    ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Переустановить и пересобрать bcrypt для текущей архитектуры
RUN cd /app/shared && npm install bcrypt --legacy-peer-deps --force && npm rebuild bcrypt

# Сгенерировать Prisma клиент (если используется)
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate; fi

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://0.0.0.0:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/main"]
