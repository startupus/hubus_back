FROM node:18-alpine AS development

# Install required system dependencies for Prisma
RUN apk add --no-cache openssl python3 make g++ libc6-compat

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

# Copy payment service
WORKDIR /app
COPY services/payment-service/package*.json ./
RUN npm install --legacy-peer-deps || npm install --legacy-peer-deps || npm install --legacy-peer-deps
# Copy source files excluding dist and node_modules
COPY services/payment-service/src ./src
COPY services/payment-service/prisma ./prisma
COPY services/payment-service/tsconfig*.json ./

# Create directory for symlink and create link to shared package
RUN mkdir -p /app/node_modules/@ai-aggregator && \
    ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

FROM node:18-alpine AS production

# Install required system dependencies for Prisma
RUN apk add --no-cache openssl python3 make g++ libc6-compat

# Настроить npm для увеличения таймаутов и retry
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

WORKDIR /app

# Copy package files
COPY services/payment-service/package*.json ./
RUN npm install --legacy-peer-deps --only=production || npm install --legacy-peer-deps --only=production || npm install --legacy-peer-deps --only=production

# Copy built files from development stage
COPY --from=development /app/dist ./dist
COPY --from=development /app/shared ./shared
COPY --from=development /app/prisma ./prisma

# Create directory for symlink and create link to shared package
RUN mkdir -p /app/node_modules/@ai-aggregator && \
    ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Reinstall and rebuild bcrypt for current architecture
RUN cd /app/shared && npm install bcrypt --legacy-peer-deps --force && npm rebuild bcrypt

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3006

# Health check - note: health endpoint is at /api/v1/health
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://0.0.0.0:3006/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/src/main"]
