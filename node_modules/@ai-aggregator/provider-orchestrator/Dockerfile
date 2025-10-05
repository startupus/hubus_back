FROM node:18-alpine AS development

WORKDIR /app

# Копировать shared пакет
COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install
RUN npm run build

# Копировать provider-orchestrator
WORKDIR /app
COPY services/provider-orchestrator/package*.json ./
RUN npm install
COPY services/provider-orchestrator ./

# Создать символическую ссылку на shared пакет
RUN ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

RUN npm run build

FROM node:18-alpine AS production

# Установить зависимости для bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY services/provider-orchestrator/package*.json ./
RUN npm install --only=production

COPY --from=development /app/dist ./dist
COPY --from=development /app/shared ./shared
COPY --from=development /app/proto ./proto

# Создать символическую ссылку на shared пакет
RUN ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

    # Переустановить bcrypt для текущей архитектуры
    RUN cd /app/shared && npm install bcrypt --force

EXPOSE 3002

CMD ["node", "dist/main"]
