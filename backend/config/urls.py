# backend/config/urls.py
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from core.api import api  # Импортируем ТОЛЬКО главный объект API

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Все запросы к /api/ делегируются объекту NinjaAPI из core
    path('', api.urls), 
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)