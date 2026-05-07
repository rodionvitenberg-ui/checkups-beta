from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import PatientProfile, User

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