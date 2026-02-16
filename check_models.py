import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from google import genai

# 1. Определяем, где мы находимся
# Берем папку, в которой лежит этот скрипт (checkups/)
BASE_DIR = Path(__file__).resolve().parent

# 2. Строим путь к .env (checkups/backend/.env)
ENV_PATH = BASE_DIR / 'backend' / '.env'

print(f"📂 Ищу .env по пути: {ENV_PATH}")

# 3. Загружаем
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
    print("✅ Файл .env найден.")
else:
    print("❌ Файл .env НЕ НАЙДЕН!")
    print("Убедись, что файл существует по указанному пути.")
    sys.exit(1)

# 4. Проверяем ключ
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ ОШИБКА: Переменная GOOGLE_API_KEY не найдена внутри .env файла!")
    print("Проверь содержимое файла. Там должно быть написано: GOOGLE_API_KEY=твой_ключ")
    sys.exit(1)

print(f"🔑 Ключ успешно загружен: {api_key[:5]}...*****")
print("-" * 30)

# 5. Запрос к Google
try:
    print("🔄 Стучусь в Google API...")
    client = genai.Client(api_key=api_key)
    
    # Получаем список моделей
    print("📋 Список доступных моделей:")
    for model in client.models.list():
        # Фильтруем, чтобы показать только Gemini
        if "gemini" in model.name:
            print(f"   • {model.name}")
            
except Exception as e:
    print(f"\n❌ Ошибка API: {e}")