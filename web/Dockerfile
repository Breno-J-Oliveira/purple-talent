FROM node:22-alpine AS styles
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM php:8.3-cli-alpine
WORKDIR /app
COPY --from=styles /build/public ./public
COPY --from=styles /build/src ./src
COPY router.php ./router.php
USER www-data
EXPOSE 8080
CMD ["php", "-S", "0.0.0.0:8080", "-t", "public", "router.php"]
