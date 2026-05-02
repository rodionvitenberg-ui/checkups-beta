from django.db import models
from django.utils.translation import gettext_lazy as _

class PromptTemplate(models.Model):
    class Role(models.TextChoices):
        EXTRACTOR = 'extractor', _('Экстрактор (Извлечение)')
        INTERPRETER = 'interpreter', _('Интерпретатор (Анализ)')
        VERIFIER = 'verifier', _('Верификатор (Проверка)')

    name = models.CharField(max_length=255, verbose_name=_("Название промпта"))
    role = models.CharField(max_length=20, choices=Role.choices, unique=True)
    
    # Системный промпт (Здесь позже через django-modeltranslation появятся system_prompt_en, _es, _ru)
    system_prompt = models.TextField(verbose_name=_("Системный промпт"))
    
    # Дополнительные данные (например, примеры или справочник slug'ов, которые можно подставлять динамически)
    context_data = models.TextField(blank=True, null=True, verbose_name=_("Дополнительный контекст/Примеры"))
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_role_display()} - {self.name}"