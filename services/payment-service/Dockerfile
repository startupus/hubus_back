FROM node:18-alpine

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
  CMD curl -f http://localhost:3006/api/v1/health || exit 1

# Start the application
CMD ["node", "dist/realistic-main.js"]
