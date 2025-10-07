FROM node:18-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --only=production

COPY --from=development /app/dist ./dist

CMD ["tail", "-f", "/dev/null"]
