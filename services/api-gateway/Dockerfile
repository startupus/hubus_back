FROM node:18-alpine AS development

# Установить зависимости для bcrypt
RUN apk add --no-cache python3 make g++

# Настроить npm для увеличения таймаутов и retry
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

WORKDIR /app

# Копировать shared пакет
COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install --legacy-peer-deps
RUN npm run build

# Копировать api-gateway
WORKDIR /app
COPY services/api-gateway/package*.json ./
RUN npm install --legacy-peer-deps || npm install --legacy-peer-deps || npm install --legacy-peer-deps
COPY services/api-gateway ./

# Создать директорию для символической ссылки и создать ссылку на shared пакет
RUN mkdir -p /app/node_modules/@ai-aggregator && \
    ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Пересобрать bcrypt для текущей архитектуры
RUN cd /app/shared && npm rebuild bcrypt

# Сгенерировать Prisma клиент
RUN npx prisma generate

RUN npm run build

FROM node:18-alpine AS production

# Установить зависимости для bcrypt и Prisma
RUN apk add --no-cache python3 make g++ openssl openssl-dev

# Настроить npm для увеличения таймаутов и retry
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

WORKDIR /app

COPY services/api-gateway/package*.json ./
RUN npm install --legacy-peer-deps --only=production || npm install --legacy-peer-deps --only=production || npm install --legacy-peer-deps --only=production

COPY --from=development /app/dist ./dist
COPY --from=development /app/shared ./shared
COPY --from=development /app/prisma ./prisma

# Создать директорию для символической ссылки и создать ссылку на shared пакет
RUN mkdir -p /app/node_modules/@ai-aggregator && \
    ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Переустановить и пересобрать bcrypt для текущей архитектуры
RUN cd /app/shared && npm install bcrypt --force && npm rebuild bcrypt

# Сгенерировать Prisma клиент
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main"]
