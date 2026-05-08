import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import PatientProfile, User, MedicalAnalysis

# 1. Справочник характеристик
class Trait(models.Model):
    class Category(models.TextChoices):
        DISEASE = 'disease', _('Заболевание')
        BAD_HABIT = 'bad_habit', _('Вредная привычка')
        GOOD_HABIT = 'good_habit', _('Полезная привычка')
        FEATURE = 'feature', _('Особенность организма')

    name = models.CharField(max_length=255, verbose_name=_("Название"))
    category = models.CharField(
        max_length=20, 
        choices=Category.choices, 
        verbose_name=_("Категория")
    )
    
    # Флаг, чтобы отличать системные пресеты от пользовательского ввода
    is_custom = models.BooleanField(default=False, verbose_name=_("Кастомная?"))
    
    # Если юзер ввел кастомную черту, мы привязываем ее к нему, 
    # чтобы не засорять глобальный справочник чужими опечатками.
    # Для системных пресетов (is_custom=False) это поле будет null.
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='custom_traits'
    )

    def __str__(self):
        return f"{self.name} [{self.get_category_display()}]"

# 2. Таблица связей (Промежуточная таблица)
class PatientTraitLink(models.Model):
    # Привязка к пациенту из приложения core
    patient = models.ForeignKey(
        PatientProfile, 
        on_delete=models.CASCADE, 
        related_name='premium_traits' # Удобное имя для ORM: patient.premium_traits.all()
    )
    # Привязка к сущности из справочника
    trait = models.ForeignKey(
        Trait, 
        on_delete=models.CASCADE, 
        related_name='patient_links'
    )
    
    # То самое "одно большое текстовое поле" для ДЕТАЛЕЙ
    details = models.TextField(
        blank=True, 
        null=True, 
        verbose_name=_("Детали (стаж, частота, дозировки)")
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Один пациент может иметь конкретную черту (например, "Диабет") только один раз
        unique_together = ('patient', 'trait')

    def __str__(self):
        return f"{self.patient.full_name} - {self.trait.name}"
    
class ChatMessage(models.Model):
    class Role(models.TextChoices):
        USER = 'user', _('Пользователь')
        ASSISTANT = 'assistant', _('Ассистент')

    analysis = models.ForeignKey(
        MedicalAnalysis, 
        on_delete=models.CASCADE, 
        related_name='chat_messages'
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_summarized = models.BooleanField(
        default=False, 
        verbose_name=_("Архивировано")
    )

    class Meta:
        verbose_name = _("Сообщение чата")
        verbose_name_plural = _("Сообщения чата")
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role} - {self.analysis.uid}"
    
class ChatSettings(models.Model):
    """
    Глобальные настройки ИИ-чата (Singleton).
    """
    optimize_tokens = models.BooleanField(
        default=True, 
        verbose_name=_("Оптимизация токенов (JSON-диета и Суммаризация)")
    )
    
    class Meta:
        verbose_name = _("Настройки чата")
        verbose_name_plural = _("Настройки чата")

    def save(self, *args, **kwargs):
        self.pk = 1  # Жестко фиксируем ID, чтобы запись была только одна
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Глобальные настройки чата"
    
class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    order_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Сумма (USD)"))
    status = models.CharField(max_length=20, default='pending', verbose_name=_("Статус")) # pending, paid, fail
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Транзакция")
        verbose_name_plural = _("Транзакции")

    def __str__(self):
        return f"{self.user.email} - ${self.amount} ({self.status})"