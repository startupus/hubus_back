FROM node:18-alpine AS development

WORKDIR /app

# Копировать shared пакет
COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install --legacy-peer-deps
RUN npm run build

# Копировать proxy-service
WORKDIR /app
COPY services/proxy-service/package*.json ./
RUN npm install --legacy-peer-deps
COPY services/proxy-service ./

# Создать символическую ссылку на shared пакет
RUN ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

RUN npm run build

FROM node:18-alpine AS production

# Установить зависимости для bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY services/proxy-service/package*.json ./
RUN npm install --legacy-peer-deps --only=production

COPY --from=development /app/dist ./dist
COPY --from=development /app/shared ./shared
# COPY --from=development /app/proto ./proto # Removed - no proto files

# Создать символическую ссылку на shared пакет
RUN ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Переустановить и пересобрать bcrypt для текущей архитектуры
RUN cd /app/shared && npm install bcrypt --force && npm rebuild bcrypt

EXPOSE 3003

CMD ["node", "dist/main"]
