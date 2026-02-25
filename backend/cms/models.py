from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
User = get_user_model()

class FAQItem(models.Model):
    question = models.CharField('Вопрос', max_length=255)
    answer = models.TextField('Ответ')
    image = models.ImageField('Изображение', upload_to='cms/faq/', null=True, blank=True)
    order = models.IntegerField('Порядок сортировки', default=0)
    is_active = models.BooleanField('Показывать на сайте', default=True)

    class Meta:
        verbose_name = 'Вопрос FAQ'
        verbose_name_plural = 'FAQ (Вопросы и ответы)'
        ordering = ['order']

    def __str__(self):
        return self.question


class ContentBlock(models.Model):
    class BlockChoices(models.TextChoices):
        HOME_HERO = 'home_hero', 'Главный экран (О ПРОЕКТЕ)'
        FEATURE_1 = 'feature_1', 'Преимущество 1 (Динамика)'
        FEATURE_2 = 'feature_2', 'Преимущество 2 (Анализ)'
        FEATURE_3 = 'feature_3', 'Преимущество 3 (История)'
        FEATURE_4 = 'feature_4', 'Преимущество 4 (Риски)'

    slug = models.CharField(
        'Уникальный ключ', 
        max_length=100, 
        unique=True,
        choices=BlockChoices.choices,
        help_text='Выберите блок страницы, который хотите заполнить'
    )
    title = models.CharField('Внутреннее название (или Заголовок)', max_length=255)
    content = models.TextField('Контент (Текст/HTML)')
    
    # ДОБАВЛЕН HELP_TEXT
    image = models.ImageField(
        'Изображение', 
        upload_to='cms/blocks/', 
        null=True, 
        blank=True,
        help_text='ВНИМАНИЕ: Загрузка изображения доступна ТОЛЬКО для блока "Главный экран (О ПРОЕКТЕ)"'
    )
    
    class Meta:
        verbose_name = 'Текстовый блок'
        verbose_name_plural = 'Текстовые блоки (Главная и др.)'

    def __str__(self):
        return f"{self.title} ({self.get_slug_display()})"

    # НОВЫЙ МЕТОД ДЛЯ ВАЛИДАЦИИ
    def clean(self):
        super().clean()
        # Если выбран любой ключ, кроме HOME_HERO, и при этом загружена картинка:
        if self.slug != self.BlockChoices.HOME_HERO and self.image:
            raise ValidationError({
                'image': 'Ошибка: Для блоков преимуществ изображения не поддерживаются. Пожалуйста, очистите это поле (поставьте галочку "Очистить").'
            })

class Testimonial(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField('Имя пользователя', max_length=100)
    text = models.TextField('Текст отзыва')
    avatar = models.ImageField('Аватарка', upload_to='cms/testimonials/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_published = models.BooleanField('Опубликовано', default=True) # Сразу публикуем для MVP

    class Meta:
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'
        ordering = ['-created_at']

    def __str__(self):
        return f"Отзыв от {self.name}"

class LegalDocument(models.Model):
    class DocumentType(models.TextChoices):
        TERMS = 'terms', 'Пользовательское соглашение'
        PRIVACY = 'privacy', 'Политика конфиденциальности'

    slug = models.CharField(
        'Тип документа', 
        max_length=50, 
        unique=True, 
        choices=DocumentType.choices
    )
    title = models.CharField('Заголовок', max_length=255)
    content = models.TextField('Текст документа')
    updated_at = models.DateTimeField('Дата последнего обновления', auto_now=True)

    class Meta:
        verbose_name = 'Юридический документ'
        verbose_name_plural = 'Юридическая информация'

    def __str__(self):
        return f"{self.title} ({self.get_slug_display()})"