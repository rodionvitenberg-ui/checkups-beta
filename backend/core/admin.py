from django.contrib import admin
from .models import User, PatientProfile, MedicalAnalysis, AnalysisIndicator

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