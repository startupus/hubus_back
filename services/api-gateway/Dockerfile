FROM node:18-alpine AS development

# Установить зависимости для bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Копировать shared пакет
COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install --legacy-peer-deps
RUN npm run build

# Копировать api-gateway
WORKDIR /app
COPY services/api-gateway/package*.json ./
RUN npm install --legacy-peer-deps
COPY services/api-gateway ./

# Создать символическую ссылку на shared пакет
RUN ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Пересобрать bcrypt для текущей архитектуры
RUN cd /app/shared && npm rebuild bcrypt

# Сгенерировать Prisma клиент
RUN npx prisma generate

RUN npm run build

FROM node:18-alpine AS production

# Установить зависимости для bcrypt и Prisma
RUN apk add --no-cache python3 make g++ openssl openssl-dev

WORKDIR /app

COPY services/api-gateway/package*.json ./
RUN npm install --legacy-peer-deps --only=production

COPY --from=development /app/dist ./dist
COPY --from=development /app/shared ./shared
COPY --from=development /app/prisma ./prisma

# Создать символическую ссылку на shared пакет
RUN ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Переустановить и пересобрать bcrypt для текущей архитектуры
RUN cd /app/shared && npm install bcrypt --force && npm rebuild bcrypt

# Сгенерировать Prisma клиент
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main"]
