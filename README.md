# WebDoc.life (Checkups)

AI-интерпретатор медицинских анализов крови. Пользователь загружает бланк анализа (PDF/фото), система распознаёт текст (OCR), анонимизирует персональные данные, прогоняет через LLM-пайплайн и выдаёт структурированную расшифровку: показатели, отклонения, возможные причины и рекомендации. Дополнительно есть ИИ-чат по каждому анализу, динамика показателей (графики), профили пациентов и PRO-подписка.

## Стек

| Слой | Технологии |
|------|-----------|
| Backend | Django 6, django-ninja (API), django-ninja-jwt, Celery, PostgreSQL, Redis |
| OCR / обработка | PyMuPDF, pdf2image, pytesseract, Pillow |
| Анонимизация | Microsoft Presidio (spaCy-модели en/ru/es) |
| LLM | DeepSeek через OpenAI SDK (мультиключ + fallback) |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS 4, next-intl (ru/en/es) |
| UI-библиотеки | framer-motion, react-three-fiber, recharts, @react-pdf/renderer |
| Payments | Cryptomus (webhook → выдача PRO) |
| Деплой | Docker Compose: db + redis + backend (gunicorn) + celery + frontend |

## Структура репозитория (монорепо)

```
checkups/
├── backend/
│   ├── config/          # settings.py, urls.py, celery.py, wsgi/asgi
│   ├── core/            # User, PatientProfile, MedicalAnalysis, AnalysisIndicator + API
│   ├── analysis/        # PromptTemplate + AnalysisPipeline (LLM: extract → interpret)
│   ├── premium/         # Trait, PatientTraitLink, ChatMessage, ChatSettings, Transaction
│   └── locale/          # переводы (modeltranslation)
├── frontend/
│   ├── app/[locale]/    # ru/en/es страницы: upload, analysis, claim, dashboard, auth...
│   ├── components/      # analysis/, dashboard/, home/, layout/, ui/
│   ├── lib/             # api.ts (axios), types.ts, store.ts (zustand)
│   ├── i18n/            # routing.ts, request.ts (next-intl)
│   └── messages/        # en.json, es.json, ru.json
├── docker-compose.yml
└── requirements.txt     # (полный замороженный список зависимостей backend)
```

## Доменная модель

| Сущность | Назначение |
|----------|-----------|
| `User` | кастомный пользователь (логин по email, без username). Поле `pro_expires_at` + свойство `is_pro`. |
| `PatientProfile` | профиль пациента (ФИО, дата рождения, пол, вес, рост). Может быть «сиротой» (`user=null`) до привязки гостем. |
| `MedicalAnalysis` | один загруженный бланк. Статусы: pending → processing → completed/failed. Хранит `ai_result` (JSON), `parent_analysis` (для reanalyze), `chat_summary`. |
| `AnalysisIndicator` | «атомарный» показатель (slug, value, unit, date) — для графиков динамики. |
| `PromptTemplate` | системные промпты по ролям (extractor / interpreter / chat_assistant), переводятся через modeltranslation. |
| `Trait` + `PatientTraitLink` | справочник характеристик пациента (заболевания, привычки, особенности) и связь M2M с деталями. |
| `ChatMessage` | сообщения ИИ-чата по анализу. Флаг `is_summarized` — для архивации старых сообщений. |
| `Transaction` | платёж Cryptomus (order_id, amount, status). |
| `ChatSettings` | singleton-настройка «оптимизация токенов» (JSON-диета / суммаризация). |

## Пайплайн обработки анализа

```
upload (PDF/фото)
  → OCR (векторный PDF читается напрямую, скан — tesseract rus+eng)
  → анонимизация Presidio (PERSON, EMAIL, PHONE, LOCATION... — даты НЕ вырезаются)
  → сборка контекста пациента (пол, возраст, ИМТ, история показателей за 180 дней, premium-черты)
  → Stage 1: "extractor" — извлекает сырые показатели/даты (JSON)
  → Stage 2: "interpreter" — выдаёт reasoning + summary + indicators + causes + recommendations (JSON)
  → сохранение ai_result + атомарных показателей
  → SSE-стрим статуса для фронтенда
```

## Запуск (локально)

### Требования
- Docker + Docker Compose
- Либо локально: Python 3.13, Node 22, PostgreSQL 16, Redis 7, Tesseract OCR (`tesseract-ocr-rus` / `eng`)

### Быстрый старт через Docker

```bash
cp backend/.env.example backend/.env   # если .env.example есть; иначе создай backend/.env вручную
docker compose up --build
```

Сервисы:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api (Swagger: http://localhost:8000/api/docs)
- Admin: http://localhost:8000/admin

### Backend (без Docker)

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate --noinput
python manage.py createsuperuser --username admin --email admin@example.com --noinput
python manage.py runserver
```

В отдельном терминале — Celery worker и broker:

```bash
cd backend && source venv/bin/activate
celery -A config worker -l INFO
```

### Frontend (без Docker)

```bash
cd frontend
npm install
npm run dev
```

### Заполнить справочник характеристик (Traits)

```bash
cd backend && source venv/bin/activate
python populated_traits.py
```

## Переменные окружения (backend/.env)

Ключевые переменные, читаемые в `settings.py` / сервисах:

| Переменная | Назначение |
|-----------|-----------|
| `SECRET_KEY` | секретный ключ Django |
| `DEBUG` | True/False |
| `ALLOWED_HOSTS` | список хостов через запятую |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | подключение к PostgreSQL |
| `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` | Redis для Celery |
| `CORS_ALLOWED_ORIGIN(S)` | разрешённые origins |
| `AI_API_KEY`, `AI_API_KEY_2`, ... | ключи LLM (DeepSeek). Мультиключ: используются все с префиксом `AI_API_KEY`. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` | SMTP |
| `CRYPTOMUS_MERCHANT_ID`, `CRYPTOMUS_API_KEY` | оплата PRO |
| `NEXT_PUBLIC_API_URL` (frontend) | базовый URL backend API |

## Тесты

```bash
# Backend
cd backend && source venv/bin/activate && python manage.py test --noinput

# Frontend (e2e — Playwright)
cd frontend && npx playwright test
```

## Документация

- `PLAN.md` — полный разбор проекта: найденные ошибки, недочёты, архитектурные замечания и детальный план улучшений.