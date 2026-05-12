# backend/Dockerfile
FROM python:3.13-slim

# Устанавливаем системные зависимости
# libpq-dev нужен для psycopg (PostgreSQL)
# tesseract-ocr и языки нужны для pytesseract
# libgl1-mesa-glx часто нужен для корректной работы библиотек обработки изображений
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-rus \
    tesseract-ocr-eng \
    tesseract-ocr-spa \
    libgl1-mesa-glx \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Оптимизация кэширования слоев Docker: сначала копируем только requirements
COPY requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копируем весь код проекта
COPY . .

# Собираем статику (WhiteNoise)
RUN python manage.py collectstatic --noinput

# Открываем порт
EXPOSE 8000

# Запускаем Gunicorn (3 воркера — оптимально для большинства VPS)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "config.wsgi:application"]