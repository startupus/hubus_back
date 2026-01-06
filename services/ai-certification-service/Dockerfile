FROM node:18-alpine AS development

# Install required dependencies
RUN apk add --no-cache openssl python3 make g++

# Настроить npm для увеличения таймаутов и retry
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

WORKDIR /app

# Copy shared package
COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install --legacy-peer-deps || npm install --legacy-peer-deps || npm install --legacy-peer-deps
RUN npm run build

# Copy service files
WORKDIR /app
COPY services/ai-certification-service/package*.json ./
RUN npm install --legacy-peer-deps || npm install --legacy-peer-deps || npm install --legacy-peer-deps
# Copy source files excluding dist and node_modules
COPY services/ai-certification-service/src ./src
COPY services/ai-certification-service/prisma ./prisma
COPY services/ai-certification-service/tsconfig*.json ./
RUN mkdir -p /app/node_modules/@ai-aggregator && \
    ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Generate Prisma client
RUN npx prisma generate

RUN npm run build

FROM node:18-alpine AS production

# Install required dependencies
RUN apk add --no-cache openssl python3 make g++

# Настроить npm для увеличения таймаутов и retry
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

WORKDIR /app

COPY services/ai-certification-service/package*.json ./
RUN npm install --legacy-peer-deps --only=production || npm install --legacy-peer-deps --only=production || npm install --legacy-peer-deps --only=production

COPY --from=development /app/dist ./dist
COPY --from=development /app/shared ./shared
COPY --from=development /app/prisma ./prisma

RUN mkdir -p /app/node_modules/@ai-aggregator && \
    ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Reinstall and rebuild bcrypt for current architecture
RUN cd /app/shared && npm install bcrypt --legacy-peer-deps --force && npm rebuild bcrypt

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3007

# Health check using node instead of wget
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3007/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/src/main"]
