FROM node:22-alpine AS builder

WORKDIR /app

# 1. ДОБАВЛЯЕМ python3, make и g++ (нужно для компиляции некоторых пакетов под Alpine)
RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json ./

# 2. МЕНЯЕМ npm ci НА npm install (он более гибкий и сам исправит несоответствия)
RUN npm install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

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