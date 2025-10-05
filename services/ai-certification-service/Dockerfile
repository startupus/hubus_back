FROM node:18-alpine AS development

WORKDIR /app

# Copy shared package
COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install

# Copy service files
WORKDIR /app
COPY services/ai-certification-service/package*.json ./
RUN npm install

COPY services/ai-certification-service ./
RUN ln -sf /app/shared /app/node_modules/@ai-aggregator/shared
RUN npm run build

FROM node:18-alpine AS production

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY services/ai-certification-service/package*.json ./
RUN npm install --only=production

COPY --from=development /app/dist ./dist
COPY --from=development /app/shared ./shared
RUN ln -sf /app/shared /app/node_modules/@ai-aggregator/shared

# Reinstall bcrypt for current architecture
RUN cd /app/shared && npm install bcrypt --force

EXPOSE 3007

CMD ["node", "dist/src/main.js"]
