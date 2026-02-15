import os
from celery import Celery

# Указываем Django settings как источник настроек
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('checkups')

# Читаем настройки из settings.py, всё, что начинается с CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

# Автоматически находим tasks.py в приложениях (core)
app.autodiscover_tasks()