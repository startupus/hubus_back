FROM node:18-alpine AS development

# Установить OpenSSL для Prisma и зависимости для bcrypt
RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

# Копировать shared пакет
COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install
RUN npm run build

# Копировать auth-service
WORKDIR /app
COPY services/auth-service/package*.json ./
RUN npm install
COPY services/auth-service ./

# Создать символическую ссылку на shared пакет
RUN ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Пересобрать bcrypt для текущей архитектуры
RUN cd /app/shared && npm rebuild bcrypt

RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS production

# Установить OpenSSL для Prisma и зависимости для bcrypt
RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

COPY services/auth-service/package*.json ./
RUN npm install --only=production

COPY --from=development /app/dist ./dist
COPY --from=development /app/prisma ./prisma
COPY --from=development /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=development /app/shared ./shared
COPY --from=development /app/proto ./proto

# Создать символическую ссылку на shared пакет
RUN ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Переустановить bcrypt для текущей архитектуры
RUN cd /app/shared && npm uninstall bcrypt && npm install bcrypt

EXPOSE 3001 50051

CMD ["node", "dist/main"]
