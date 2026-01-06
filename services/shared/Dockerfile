FROM node:18-alpine AS development

# Настроить npm для увеличения таймаутов и retry
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install --legacy-peer-deps || npm install --legacy-peer-deps

COPY src ./src
COPY tsconfig*.json ./
RUN npm run build

FROM node:18-alpine AS production

# Настроить npm для увеличения таймаутов и retry
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --only=production || npm install --legacy-peer-deps --only=production || npm install --legacy-peer-deps --only=production

COPY --from=development /app/dist ./dist

CMD ["tail", "-f", "/dev/null"]
