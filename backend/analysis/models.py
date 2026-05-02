from django.db import models
from django.utils.translation import gettext_lazy as _

class PromptTemplate(models.Model):
    """
    Шаблоны промптов для разных этапов пайплайна.
    Благодаря django-modeltranslation, поля system_prompt и context_data
    будут иметь суффиксы (например, system_prompt_en, system_prompt_ru).
    """
    class Role(models.TextChoices):
        EXTRACTOR = 'extractor', _('Экстрактор (Извлечение)')
        INTERPRETER = 'interpreter', _('Интерпретатор (Анализ)')

    name = models.CharField(max_length=255, verbose_name=_("Название (для админки)"))
    role = models.CharField(max_length=20, choices=Role.choices, unique=True, verbose_name=_("Роль в пайплайне"))
    
    # Это поле будет переводиться (появятся system_prompt_en, system_prompt_es, etc.)
    system_prompt = models.TextField(verbose_name=_("Системный промпт"))
    
    # Дополнительные данные (Справочники, примеры) - тоже переводится
    context_data = models.TextField(blank=True, null=True, verbose_name=_("Дополнительный контекст/Примеры"))
    
    is_active = models.BooleanField(default=True, verbose_name=_("Активен"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Шаблон промпта")
        verbose_name_plural = _("Шаблоны промптов")

    def __str__(self):
        return f"{self.get_role_display()} - {self.name}"