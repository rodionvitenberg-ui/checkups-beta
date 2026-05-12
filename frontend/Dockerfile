# frontend/Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# libc6-compat нужен для некоторых бинарных зависимостей (например, sharp/recharts) под Alpine
RUN apk add --no-cache libc6-compat

# Копируем манифесты
COPY package.json package-lock.json ./

# Устанавливаем зависимости чисто и строго по лок-файлу
RUN npm ci

# Копируем исходный код
COPY . .

# Отключаем телеметрию Next.js для ускорения сборки
ENV NEXT_TELEMETRY_DISABLED=1

# Собираем проект
RUN npm run build

# --- ФИНАЛЬНЫЙ СЛОЙ (RUNNER) ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Копируем статику и скомпилированные standalone-файлы из слоя builder
COPY --from=builder /app/public ./public
# standalone папка создается Next.js автоматически (если output: 'standalone')
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Запускаем встроенный сервер Next.js
CMD ["node", "server.js"]