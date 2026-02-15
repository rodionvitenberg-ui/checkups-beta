import uuid
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

# --- Модель Анализа ---
class MedicalAnalysis(models.Model):
    # Уникальный ID, который мы отдадим фронту сразу после загрузки файла
    # По этому ID мы будем "клеймить" (claim) анализ после регистрации
    uid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analyses', null=True, blank=True)
    
    file = models.FileField(upload_to='analyses/%Y/%m/%d/')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Статус обработки
    class Status(models.TextChoices):
        PENDING = 'pending', 'Ожидает'
        PROCESSING = 'processing', 'В работе'
        COMPLETED = 'completed', 'Готово'
        FAILED = 'failed', 'Ошибка'
        
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Результат от AI храним в JSON, чтобы фронт мог красиво рендерить блоки
    # (Клинический анализ, Причины, Рекомендации)
    ai_result = models.JSONField(null=True, blank=True)
    
    def __str__(self):
        return f"Analysis {self.uid} ({self.status})"