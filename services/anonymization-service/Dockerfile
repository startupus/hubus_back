# Multi-stage build for anonymization-service
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY services/shared/package*.json ./services/shared/

# Install dependencies
RUN npm install --legacy-peer-deps
RUN cd services/shared && npm install --legacy-peer-deps

# Development stage
FROM base AS development
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/shared/node_modules ./services/shared/node_modules

# Copy source code
COPY . .

# Build shared package
RUN cd services/shared && npm run build

# Build anonymization service
RUN cd services/anonymization-service && npm run build

# Expose port
EXPOSE 3008

# Start in development mode
CMD ["npm", "run", "start:dev"]

# Production stage
FROM base AS production
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/shared/node_modules ./services/shared/node_modules

# Copy built application
COPY --from=development /app/services/anonymization-service/dist ./dist
COPY --from=development /app/services/shared/dist ./services/shared/dist

# Copy package files
COPY package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3008

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3008/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["node", "dist/main"]
