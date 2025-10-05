# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Install required dependencies for Prisma
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Create logs directory
RUN mkdir -p /app/logs

# Copy package files
COPY services/analytics-service/package*.json ./
COPY services/shared/package*.json ./shared/

# Install dependencies
RUN npm install --only=production

# Copy shared package
COPY services/shared ./shared

# Build shared package
WORKDIR /app/shared
RUN npm install
RUN npm run build

# Copy analytics service source
WORKDIR /app
COPY services/analytics-service ./

# Install shared package locally
RUN npm install ./shared

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3005/health || exit 1

# Start the application
CMD ["npm", "run", "start:prod"]