from django.contrib import admin
from modeltranslation.admin import TranslationAdmin
from .models import PromptTemplate

@admin.register(PromptTemplate)
class PromptTemplateAdmin(TranslationAdmin):
    list_display = ('name', 'role', 'is_active', 'updated_at')
    list_filter = ('role', 'is_active')
    search_fields = ('name',)