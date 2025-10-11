FROM node:18-alpine AS development

WORKDIR /app

# Копировать shared пакет
COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install --legacy-peer-deps
RUN npm run build

# Копировать provider-orchestrator
WORKDIR /app
COPY services/provider-orchestrator/package*.json ./
RUN npm install --legacy-peer-deps
COPY services/provider-orchestrator ./

# Создать символическую ссылку на shared пакет
RUN ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

RUN npm run build

FROM node:18-alpine AS production

# Установить зависимости для bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY services/provider-orchestrator/package*.json ./
RUN npm install --legacy-peer-deps --only=production

COPY --from=development /app/dist ./dist
COPY --from=development /app/shared ./shared
# COPY --from=development /app/proto ./proto # Removed - no proto files

# Создать символическую ссылку на shared пакет
RUN ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Переустановить и пересобрать bcrypt для текущей архитектуры
RUN cd /app/shared && npm install bcrypt --force && npm rebuild bcrypt

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://0.0.0.0:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/main"]
