FROM node:18-alpine

# Install required system dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files
COPY services/payment-service/package*.json ./
COPY services/shared ../shared

# Install dependencies
RUN npm ci

# Copy source code
COPY services/payment-service/src ./src
COPY services/payment-service/prisma ./prisma
COPY services/payment-service/tsconfig.json ./

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Copy compiled files to the correct location
RUN cp -r dist/app/src/* dist/ && rm -rf dist/app dist/shared

# Expose port
EXPOSE 3006

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://0.0.0.0:3006/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/realistic-main.js"]
