from django.contrib import admin
from .models import FAQItem, ContentBlock

@admin.register(FAQItem)
class FAQItemAdmin(admin.ModelAdmin):
    list_display = ('question', 'order', 'is_active')
    list_editable = ('order', 'is_active') # Можно менять порядок прямо в списке!
    search_fields = ('question', 'answer')

@admin.register(ContentBlock)
class ContentBlockAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug')
    search_fields = ('title', 'slug', 'content')