# Multi-stage build for React frontend
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code (только нужные файлы)
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/tsconfig*.json ./
COPY frontend/*.config.* ./
COPY frontend/index.html ./

# Build the app
RUN npm run build

# Production stage
FROM nginx

# Copy built app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
