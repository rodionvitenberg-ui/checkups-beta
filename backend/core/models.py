import uuid
import datetime
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

# --- Менеджер для создания пользователя по Email ---
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email обязателен')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

# --- Кастомный Юзер ---
class User(AbstractUser):
    username = None  # Убираем username, используем email
    email = models.EmailField('Email address', unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email
    
class PatientProfile(models.Model):
    """
    Профиль конкретного человека (Папа, Ребенок, Я), 
    к которому привязываются анализы.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patients')
    
    # Как пользователь называет пациента (например: "Сынок", "Мама", "Василий")
    full_name = models.CharField(max_length=255)
    
    # Данные для медицинской логики
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=10, 
        choices=[('M', 'Male'), ('F', 'Female')],
        null=True, blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.user.email})"

# --- Модель Анализа ---
class MedicalAnalysis(models.Model):
    uid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analyses', null=True, blank=True)
    
    # Ссылка на профиль (может быть пустой, пока юзер не привяжет)
    patient = models.ForeignKey(PatientProfile, on_delete=models.SET_NULL, related_name='analyses', null=True, blank=True)
    
    file = models.FileField(upload_to='analyses/%Y/%m/%d/')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Ожидает'
        PROCESSING = 'processing', 'В работе'
        COMPLETED = 'completed', 'Готово'
        FAILED = 'failed', 'Ошибка'
        
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # JSON от AI (теперь будет включать и данные о найденном имени)
    ai_result = models.JSONField(null=True, blank=True)
    
    def __str__(self):
        return f"Analysis {self.uid} ({self.status})"
    
class AnalysisIndicator(models.Model):
    """
    Атомарная запись одного показателя для построения графиков.
    Одна строка = Одна точка на графике.
    """
    analysis = models.ForeignKey(MedicalAnalysis, on_delete=models.CASCADE, related_name='atomic_indicators')
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='indicators')
    
    # slug из справочника (например, 'hemoglobin'). 
    # db_index=True критически важен для быстрого поиска по всей истории.
    slug = models.CharField(max_length=50, db_index=True)
    
    # Оригинальное название (для отображения в тултипе графика)
    name = models.CharField(max_length=255)
    
    # Числовое значение для графиков. 
    # Если AI вернул "не обнаружено", value будет null.
    value = models.FloatField(null=True, blank=True)
    
    # Строковое значение (на всякий случай, если парсинг числа не удался)
    string_value = models.CharField(max_length=50)
    
    unit = models.CharField(max_length=50, null=True, blank=True)
    
    # Дата взятия анализа (берем из анализа или OCR)
    date = models.DateField(default=datetime.date.today)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ускоряет запросы вида: "Дай мне гемоглобин этого пациента за год"
        indexes = [
            models.Index(fields=['patient', 'slug', 'date']),
        ]

    def __str__(self):
        return f"{self.patient.full_name} - {self.slug}: {self.value}"