FROM node:18-alpine AS development

# Установить OpenSSL для Prisma и зависимости для bcrypt
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

# Копировать auth-service
WORKDIR /app
COPY services/auth-service/package*.json ./
RUN npm install --legacy-peer-deps || npm install --legacy-peer-deps || npm install --legacy-peer-deps
COPY services/auth-service ./

# Установить shared пакет как зависимость
RUN npm install ./shared --legacy-peer-deps

# Установить bcrypt напрямую в сервис
RUN npm install bcrypt --legacy-peer-deps --force

RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS production

# Установить OpenSSL для Prisma и зависимости для bcrypt
RUN apk add --no-cache openssl python3 make g++

# Настроить npm для увеличения таймаутов и retry
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

WORKDIR /app

COPY services/auth-service/package*.json ./
RUN npm install --legacy-peer-deps --only=production || npm install --legacy-peer-deps --only=production || npm install --legacy-peer-deps --only=production

COPY --from=development /app/dist ./dist
COPY --from=development /app/prisma ./prisma
COPY --from=development /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=development /app/shared ./shared
# COPY --from=development /app/proto ./proto # Removed - no proto files

# Установить shared пакет как зависимость
RUN npm install ./shared --legacy-peer-deps

# Установить и пересобрать bcrypt напрямую в сервис
RUN npm install bcrypt --legacy-peer-deps --force && npm rebuild bcrypt

EXPOSE 3001 50051

CMD ["node", "dist/main"]
