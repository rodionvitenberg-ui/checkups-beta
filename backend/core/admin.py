from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
import json
from premium.models import ChatMessage # Импортируем сообщения чата
from .models import User, PatientProfile, MedicalAnalysis, AnalysisIndicator, SystemAnalytics
from django.contrib import admin

# ==========================================
# УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ
# ==========================================
@admin.register(User)
class CustomUserAdmin(admin.ModelAdmin):
    # Твой кастомный юзер использует email вместо username, поэтому выводим именно его
    list_display = ('email', 'phone', 'is_staff', 'is_active', 'date_joined')
    search_fields = ('email', 'phone')
    list_filter = ('is_staff', 'is_active', 'date_joined')
    ordering = ('-date_joined',)

# ==========================================
# УПРАВЛЕНИЕ ПРОФИЛЯМИ ПАЦИЕНТОВ
# ==========================================
@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'gender', 'birth_date', 'created_at')
    search_fields = ('full_name', 'user__email')
    list_filter = ('gender', 'created_at')
    ordering = ('-created_at',)

# ==========================================
# УПРАВЛЕНИЕ АНАЛИЗАМИ
# ==========================================
@admin.register(MedicalAnalysis)
class MedicalAnalysisAdmin(admin.ModelAdmin):
    list_display = ('uid', 'user', 'patient', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    # Поиск работает по UID, почте пользователя и имени пациента
    search_fields = ('uid', 'user__email', 'patient__full_name')
    readonly_fields = ('uid', 'created_at')
    ordering = ('-created_at',)

# ==========================================
# УПРАВЛЕНИЕ ОТДЕЛЬНЫМИ ПОКАЗАТЕЛЯМИ (ДЛЯ ГРАФИКОВ)
# ==========================================
@admin.register(AnalysisIndicator)
class AnalysisIndicatorAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'value', 'unit', 'patient', 'date')
    search_fields = ('name', 'slug', 'patient__full_name')
    list_filter = ('slug', 'date')
    ordering = ('-date',)

@admin.register(SystemAnalytics)
class SystemAnalyticsAdmin(admin.ModelAdmin):
    # Указываем кастомный шаблон (мы создадим его на следующем шаге)
    change_list_template = "admin/core/systemanalytics/change_list.html"

    def changelist_view(self, request, extra_context=None):
        # 1. Базовые метрики
        total_users = User.objects.count()
        total_analyses = MedicalAnalysis.objects.count()
        completed_analyses = MedicalAnalysis.objects.filter(status='completed').count()
        failed_analyses = MedicalAnalysis.objects.filter(status='failed').count()
        total_messages = ChatMessage.objects.count()

        # 2. Данные для графика: Количество анализов по дням за последние 7 дней
        seven_days_ago = timezone.now() - timedelta(days=7)
        
        daily_stats = MedicalAnalysis.objects.filter(created_at__gte=seven_days_ago) \
            .annotate(date=TruncDate('created_at')) \
            .values('date') \
            .annotate(count=Count('uid')) \
            .order_by('date')

        # Подготавливаем списки для графика (Chart.js)
        dates = [stat['date'].strftime('%d %b') for stat in daily_stats]
        counts = [stat['count'] for stat in daily_stats]

        # 3. Экономика (примерная)
        # Допустим, мы считаем, что один анализ тратит в среднем 5000 токенов
        estimated_tokens = completed_analyses * 5000 + total_messages * 1500

        # Упаковываем всё в контекст
        extra_context = extra_context or {}
        extra_context.update({
            'total_users': total_users,
            'total_analyses': total_analyses,
            'completed_analyses': completed_analyses,
            'failed_analyses': failed_analyses,
            'error_rate': round((failed_analyses / total_analyses * 100), 1) if total_analyses > 0 else 0,
            'total_messages': total_messages,
            'estimated_tokens': estimated_tokens,
            'chart_dates': json.dumps(dates),
            'chart_counts': json.dumps(counts),
        })

        return super().changelist_view(request, extra_context=extra_context)