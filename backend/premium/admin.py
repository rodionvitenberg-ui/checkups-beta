# backend/premium/admin.py

from django.contrib import admin
from modeltranslation.admin import TranslationAdmin
from .models import Trait, PatientTraitLink

@admin.register(Trait)
class TraitAdmin(TranslationAdmin): # <-- Наследуемся от TranslationAdmin
    list_display = ('name', 'category', 'is_custom', 'created_by')
    list_filter = ('category', 'is_custom')
    search_fields = ('name', 'created_by__email')
    raw_id_fields = ('created_by',)

@admin.register(PatientTraitLink)
class PatientTraitLinkAdmin(admin.ModelAdmin):
    list_display = ('patient', 'trait', 'short_details', 'updated_at')
    list_filter = ('trait__category', 'created_at')
    search_fields = ('patient__full_name', 'trait__name', 'details')
    raw_id_fields = ('patient', 'trait')

    def short_details(self, obj):
        if obj.details:
            return obj.details[:50] + "..." if len(obj.details) > 50 else obj.details
        return "-"
    short_details.short_description = "Детали"