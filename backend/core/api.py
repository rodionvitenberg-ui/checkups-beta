import uuid
from typing import List
from ninja import NinjaAPI, UploadedFile, File
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.contrib.auth import get_user_model
from .models import MedicalAnalysis, PatientProfile, User, AnalysisIndicator
from .schemas import (
    AnalysisResponseSchema,
    ClaimRequestSchema,
    AuthResponseSchema,
    PatientProfileSchema,
    CreateProfileSchema,
    AssignProfileRequest,
    ChartResponseSchema, 
    IndicatorHistoryPoint
)
from .tasks import process_analysis_task

# Инициализация API
api = NinjaAPI()

# --- 1. Загрузка и Получение результатов ---

@api.post("/analyses/upload", response=AnalysisResponseSchema)
def upload_analysis(request, file: UploadedFile = File(...)):
    """
    Загрузка файла.
    Если пользователь авторизован — сразу привязываем к нему.
    Запускаем Celery задачу на обработку.
    """
    user = request.user if request.user.is_authenticated else None
    
    analysis = MedicalAnalysis.objects.create(
        file=file,
        user=user,
        status=MedicalAnalysis.Status.PENDING
    )
    
    # Асинхронный запуск пайплайна обработки
    process_analysis_task.delay(analysis.id)
    
    return analysis

@api.get("/analyses/{uid}", response=AnalysisResponseSchema)
def get_analysis_result(request, uid: uuid.UUID):
    """
    Получение статуса и результатов анализа.
    """
    analysis = get_object_or_404(MedicalAnalysis, uid=uid)
    
    # Проверка доступа: чужие анализы смотреть нельзя
    if analysis.user and request.user != analysis.user:
         return api.create_response(request, {"message": "Доступ запрещен"}, status=403)
         
    return analysis

# --- 2. Управление Профилями Пациентов (Новый функционал) ---

@api.get("/profiles", response=List[PatientProfileSchema])
def list_profiles(request):
    """
    Получить список всех профилей текущего пользователя.
    (Я, Мама, Дети и т.д.)
    """
    if not request.user.is_authenticated:
        return api.create_response(request, {"message": "Unauthorized"}, status=401)
    
    return PatientProfile.objects.filter(user=request.user)

@api.post("/profiles", response=PatientProfileSchema)
def create_profile(request, payload: CreateProfileSchema):
    """
    Создать новый профиль вручную.
    """
    if not request.user.is_authenticated:
        return api.create_response(request, {"message": "Unauthorized"}, status=401)
    
    profile = PatientProfile.objects.create(
        user=request.user,
        full_name=payload.full_name,
        birth_date=payload.birth_date,
        gender=payload.gender
    )
    return profile

@api.post("/analyses/{uid}/assign-profile", response=AnalysisResponseSchema)
def assign_profile(request, uid: uuid.UUID, payload: AssignProfileRequest):
    """
    Привязать конкретный анализ к профилю пациента.
    Например: "Этот анализ крови принадлежит моей бабушке".
    """
    if not request.user.is_authenticated:
        return api.create_response(request, {"message": "Unauthorized"}, status=401)

    # Ищем анализ и профиль, проверяя, что они принадлежат текущему юзеру
    analysis = get_object_or_404(MedicalAnalysis, uid=uid, user=request.user)
    profile = get_object_or_404(PatientProfile, id=payload.profile_id, user=request.user)

    analysis.patient = profile
    analysis.save()
    
    return analysis

# --- 3. Авторизация и "Усыновление" анализа (Обновлено) ---

@api.post("/auth/claim-analysis", response=AuthResponseSchema)
def claim_analysis(request, payload: ClaimRequestSchema):
    """
    Превращение анонимного пользователя в зарегистрированного
    после загрузки первого анализа.
    Автоматически создает профиль 'Я'.
    """
    analysis = get_object_or_404(MedicalAnalysis, uid=payload.analysis_uid)
    
    if analysis.user:
        return api.create_response(request, {"message": "Анализ уже привязан"}, status=400)

    # Используем транзакцию, чтобы всё создалось или ничего
    with transaction.atomic():
        # 1. Создаем или получаем юзера
        user, created = User.objects.get_or_create(email=payload.email)
        
        if created:
            # Генерируем временный пароль
            password = User.objects.make_random_password()
            user.set_password(password)
            user.phone = payload.phone
            user.save()
            
            # TODO: В продакшене подключить отправку email через Celery
            print(f"📧 EMAIL TO {user.email}: Ваш пароль: {password}")
            
            # 2. АВТОМАТИЧЕСКИ СОЗДАЕМ ОСНОВНОЙ ПРОФИЛЬ "Я"
            # Чтобы у пользователя сразу был дефолтный профиль
            main_profile = PatientProfile.objects.create(
                user=user,
                full_name="Я (Основной профиль)",
                # Можно добавить логику: если AI нашел дату рождения в анализе, подставить её сюда
            )
        else:
            # Если юзер уже был, берем его первый профиль или создаем, если нет
            main_profile = user.patients.first()
            if not main_profile:
                 main_profile = PatientProfile.objects.create(user=user, full_name="Я")

        # 3. Привязываем анализ к юзеру
        analysis.user = user
        
        # 4. Логика привязки к профилю:
        # Для MVP привязываем к "Я" по умолчанию. 
        # В будущем фронтенд может спросить: "Это вы или кто-то другой?" перед claim.
        if not analysis.patient:
            analysis.patient = main_profile
            
        analysis.save()
    
    # Генерация токена (заглушка)
    fake_token = f"jwt-token-for-{user.id}"
    
    return {"token": fake_token, "user_email": user.email}

@api.get("/patients/{patient_id}/history", response=List[ChartResponseSchema])
def get_patient_history(request, patient_id: int, slugs: str = None):
    """
    Получить историю показателей для графиков.
    slugs: список кодов через запятую (например: "hemoglobin,ferritin").
    Если slugs не передан — вернет историю по ВСЕМ показателям.
    """
    if not request.user.is_authenticated:
        return api.create_response(request, {"message": "Unauthorized"}, status=401)
    
    # Проверяем доступ к профилю
    profile = get_object_or_404(PatientProfile, id=patient_id, user=request.user)
    
    # Базовый запрос
    indicators_qs = AnalysisIndicator.objects.filter(patient=profile).order_by('date')
    
    # Фильтрация по конкретным показателям
    if slugs:
        slug_list = [s.strip() for s in slugs.split(',')]
        indicators_qs = indicators_qs.filter(slug__in=slug_list)
    
    # Группировка данных: нам нужно вернуть структуру 
    # [ {slug: "hgb", data: [...]}, {slug: "ferritin", data: [...]} ]
    
    # 1. Собираем уникальные слаги и имена
    grouped_data = {} # {slug: {name: "Гемоглобин", points: []}}
    
    for record in indicators_qs:
        if record.slug not in grouped_data:
            grouped_data[record.slug] = {
                "name": record.name, # Берем первое попавшееся имя
                "points": []
            }
        
        if record.value is not None:
            grouped_data[record.slug]["points"].append({
                "date": record.date,
                "value": record.value,
                "unit": record.unit,
                "analysis_uid": record.analysis.uid
            })
            
    # 2. Формируем финальный список
    response = []
    for slug, info in grouped_data.items():
        if info["points"]: # Только если есть данные
            response.append({
                "slug": slug,
                "name": info["name"],
                "data": info["points"]
            })
            
    return response