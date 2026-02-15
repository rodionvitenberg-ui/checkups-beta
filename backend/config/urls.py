from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from core.api import api  # Импортируем объект NinjaAPI из нашего core/api.py

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Подключаем API. 
    # Все эндпоинты будут начинаться с /api/
    # Например: /api/analyses/upload
    # Документация будет тут: /api/docs
    path('api/', api.urls),
]

# В режиме разработки (DEBUG=True) Django должен сам отдавать загруженные файлы.
# В продакшене этим будет заниматься Nginx.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)