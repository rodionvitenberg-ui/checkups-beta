FROM node:22-alpine AS builder

WORKDIR /app

# 1. ДОБАВЛЯЕМ python3, make и g++ (нужно для компиляции некоторых пакетов под Alpine)
RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json ./

# 2. МЕНЯЕМ npm ci НА npm install (он более гибкий и сам исправит несоответствия)
RUN npm install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* переменные вшиваются в клиентский бандл НА ЭТАПЕ СБОРКИ.
# Их нельзя передавать только через runtime environment (docker-compose).
# ВАЖНО: бэкенд монтирует маршруты в КОРНЕ (без /api).
ARG NEXT_PUBLIC_API_URL=https://api.webdoc.life
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# --- ФИНАЛЬНЫЙ СЛОЙ (RUNNER) ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]