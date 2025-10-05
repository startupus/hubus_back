FROM node:18-alpine AS development

# Установить зависимости для bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Копировать shared пакет
COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install
RUN npm run build

# Копировать api-gateway
WORKDIR /app
COPY services/api-gateway/package*.json ./
RUN npm install
COPY services/api-gateway ./

# Создать символическую ссылку на shared пакет
RUN ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Пересобрать bcrypt для текущей архитектуры
RUN cd /app/shared && npm rebuild bcrypt

RUN npm run build

FROM node:18-alpine AS production

# Установить зависимости для bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY services/api-gateway/package*.json ./
RUN npm install --only=production

COPY --from=development /app/dist ./dist
COPY --from=development /app/shared ./shared

# Создать символическую ссылку на shared пакет
RUN ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Переустановить bcrypt для текущей архитектуры
RUN cd /app/shared && npm install bcrypt --force

EXPOSE 3000

CMD ["node", "dist/main"]
