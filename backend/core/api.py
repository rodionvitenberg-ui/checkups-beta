import uuid
from typing import List, Optional
from ninja import NinjaAPI, UploadedFile, File, Schema
from ninja.security import HttpBearer
from ninja.errors import HttpError

# Django imports
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.http import FileResponse, Http404
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string  # <--- ВАЖНЫЙ ИМПОРТ
from django.db import transaction

# JWT imports
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.tokens import RefreshToken, AccessToken
from ninja_jwt.exceptions import InvalidToken, TokenError

# Local imports
from .models import MedicalAnalysis, PatientProfile, User, AnalysisIndicator
from .schemas import (
    AnalysisResponseSchema,
    ClaimRequestSchema,
    AuthResponseSchema,
    PatientProfileSchema,
    CreateProfileSchema,
    AssignProfileRequest,
    ChartResponseSchema
)
from .tasks import process_analysis_task

# --- Схемы для Авторизации ---

class LoginSchema(Schema):
    email: str
    password: str

class RegisterSchema(Schema):
    email: str
    phone: str = None
    password: str = None

class ResetPasswordRequestSchema(Schema):
    email: str

class ResetPasswordConfirmSchema(Schema):
    uidb64: str
    token: str
    new_password: str

class UpdateProfileSchema(Schema):
    full_name: str

# --- Инициализация API ---

api = NinjaAPI()

User = get_user_model()

# ==========================================
# 1. АВТОРИЗАЦИЯ И УПРАВЛЕНИЕ АККАУНТОМ
# ==========================================

@api.post("/auth/register", response=AuthResponseSchema)
def register(request, payload: RegisterSchema):
    if User.objects.filter(email=payload.email).exists():
        return api.create_response(request, {"message": "Пользователь с таким email уже существует"}, status=400)
    
    with transaction.atomic():
        # Создаем пользователя без поля username
        user = User.objects.create(
            email=payload.email,
            phone=payload.phone
        )
        
        # ИСПРАВЛЕНИЕ: Используем get_random_string вместо make_random_password
        password = payload.password or get_random_string(12)
        user.set_password(password)
        user.save()
        
        # Создаем дефолтный профиль
        PatientProfile.objects.create(user=user, full_name="Основной профиль")
        
        # Отправка письма
        if not payload.password:
            try:
                send_mail(
                    subject='Регистрация в Checkups',
                    message=f'Добро пожаловать в Checkups!\n\nВаши данные для входа:\nЛогин: {user.email}\nВаш пароль: {password}\n\nПожалуйста, сохраните эти данные или смените пароль в личном кабинете.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True, 
                )
            except Exception as e:
                print(f"❌ Ошибка отправки письма при регистрации: {e}")

    refresh = RefreshToken.for_user(user)
    return {
        "token": str(refresh.access_token),
        "user_email": user.email
    }

@api.post("/auth/login", response=AuthResponseSchema)
def login(request, payload: LoginSchema):
    user = authenticate(username=payload.email, password=payload.password)
    if not user:
        return api.create_response(request, {"message": "Неверный email или пароль"}, status=401)
    
    refresh = RefreshToken.for_user(user)
    return {
        "token": str(refresh.access_token),
        "user_email": user.email
    }

@api.post("/auth/claim-analysis", response=AuthResponseSchema)
def claim_analysis(request, payload: ClaimRequestSchema):
    """
    Привязка анализа к пользователю (регистрация или вход).
    """
    analysis = get_object_or_404(MedicalAnalysis, uid=payload.analysis_uid)
    
    if analysis.user:
        return api.create_response(request, {"message": "Анализ уже привязан к аккаунту"}, status=400)

    with transaction.atomic():
        user, created = User.objects.get_or_create(
            email=payload.email
        )
        
        if created:
            # ИСПРАВЛЕНИЕ: Используем get_random_string вместо make_random_password
            password = get_random_string(12)
            user.set_password(password)
            user.phone = payload.phone
            user.save()
            
            try:
                send_mail(
                    subject='Ваш результат сохранен | Checkups',
                    message=f'Ваш анализ успешно сохранен в системе.\n\nМы автоматически создали для вас личный кабинет.\nЛогин: {user.email}\nПароль: {password}\n\nИспользуйте эти данные для входа и просмотра истории анализов.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"❌ Ошибка отправки письма при claim: {e}")
            
            main_profile = PatientProfile.objects.create(user=user, full_name="Я (Основной профиль)")
        else:
            main_profile = user.patients.first()
            if not main_profile:
                 main_profile = PatientProfile.objects.create(user=user, full_name="Я")

        analysis.user = user
        if not analysis.patient:
            analysis.patient = main_profile
        analysis.save()
    
    refresh = RefreshToken.for_user(user)
    return {
        "token": str(refresh.access_token),
        "user_email": user.email
    }

# --- Восстановление пароля ---

@api.post("/auth/reset-password-request")
def reset_password_request(request, payload: ResetPasswordRequestSchema):
    try:
        user = User.objects.get(email=payload.email)
    except User.DoesNotExist:
        return {"message": "Если такой email существует, мы отправили инструкцию."}

    # Генерируем токен
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Ссылка на фронтенд (Замени localhost на боевой домен при деплое!)
    domain = "http://92.113.146.158" 
    reset_link = f"{domain}/auth/reset-password?uid={uid}&token={token}"
    
    try:
        send_mail(
            subject='Восстановление пароля Checkups',
            message=f'Вы запросили сброс пароля.\nДля установки нового пароля перейдите по ссылке:\n{reset_link}\n\nЕсли вы не запрашивали это действие, просто проигнорируйте письмо.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception as e:
        print(f"❌ Ошибка отправки письма при сбросе: {e}")
    
    return {"message": "Инструкция по сбросу пароля отправлена на Email."}

@api.post("/auth/reset-password-confirm")
def reset_password_confirm(request, payload: ResetPasswordConfirmSchema):
    try:
        uid = force_str(urlsafe_base64_decode(payload.uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return api.create_response(request, {"message": "Неверная ссылка"}, status=400)

    if not default_token_generator.check_token(user, payload.token):
        return api.create_response(request, {"message": "Ссылка устарела или недействительна"}, status=400)

    user.set_password(payload.new_password)
    user.save()
    
    return {"message": "Пароль успешно изменен. Теперь вы можете войти."}


# ==========================================
# 2. РАБОТА С АНАЛИЗАМИ (Гибридный доступ)
# ==========================================

@api.post("/analyses/upload", response=AnalysisResponseSchema)
def upload_analysis(request, file: UploadedFile = File(...)):
    """
    Загрузка файла.
    Работает И для авторизованных, И для анонимов.
    Если юзер авторизован - сразу вяжем к его основному профилю.
    """
    user = None
    patient_profile = None # <--- Новая переменная
    
    # 1. Ручная проверка JWT (как и было)
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token_str = auth_header.split(' ')[1]
        try:
            access_token = AccessToken(token_str)
            user_id = access_token['user_id']
            user = User.objects.get(id=user_id)
        except (TokenError, User.DoesNotExist):
            pass

    # 2. ЕСЛИ ЮЗЕР НАЙДЕН -> ИЩЕМ ЕГО ПРОФИЛЬ
    if user:
        # Берем первый профиль (обычно это "Я")
        patient_profile = PatientProfile.objects.filter(user=user).first()
        
        # Fallback: Если вдруг профиля нет (старый юзер?), создаем его
        if not patient_profile:
             patient_profile = PatientProfile.objects.create(
                 user=user, 
                 full_name="Я (Основной профиль)"
             )

    # 3. СОЗДАЕМ АНАЛИЗ С ПРИВЯЗКОЙ
    analysis = MedicalAnalysis.objects.create(
        file=file,
        user=user,
        patient=patient_profile, # <--- ВОТ ГЛАВНЫЙ ФИКС
        status=MedicalAnalysis.Status.PENDING
    )
    
    # Запускаем Celery только после коммита
    transaction.on_commit(lambda: process_analysis_task.delay(analysis.uid))
    
    return analysis

# ==========================================
# 3. ЛИЧНЫЙ КАБИНЕТ (Защищено JWT)
# ==========================================

@api.get("/profiles", response=List[PatientProfileSchema], auth=JWTAuth())
def list_profiles(request):
    return PatientProfile.objects.filter(user=request.user)

@api.post("/profiles", response=PatientProfileSchema, auth=JWTAuth())
def create_profile(request, payload: CreateProfileSchema):
    profile = PatientProfile.objects.create(
        user=request.user,
        full_name=payload.full_name,
        birth_date=payload.birth_date,
        gender=payload.gender
    )
    return profile

@api.delete("/profiles/{profile_id}", auth=JWTAuth())
def delete_profile(request, profile_id: int):
    profile = get_object_or_404(PatientProfile, id=profile_id, user=request.user)
    
    # Защита от удаления папки "Неразобранное"
    if profile.full_name == "Анализы" or "Основной" in profile.full_name:
        return api.create_response(request, {"message": "Базовый профиль удалить нельзя"}, status=400)
        
    profile.delete()
    return {"success": True}

@api.post("/assign-profile", response={200: AnalysisResponseSchema, 403: dict}, auth=JWTAuth())
def assign_profile(request, payload: AssignProfileRequest):
    # Требуется реализация логики привязки
    return 403, {"message": "Not implemented yet fully"}

@api.get("/patients/{patient_id}/history", response=List[ChartResponseSchema], auth=JWTAuth())
def get_patient_history(request, patient_id: int, slugs: str = None):
    profile = get_object_or_404(PatientProfile, id=patient_id, user=request.user)
    
    indicators_qs = AnalysisIndicator.objects.filter(patient=profile).order_by('date')
    
    if slugs:
        slug_list = [s.strip() for s in slugs.split(',')]
        indicators_qs = indicators_qs.filter(slug__in=slug_list)
    
    grouped_data = {} 
    
    for record in indicators_qs:
        if record.slug not in grouped_data:
            grouped_data[record.slug] = {
                "name": record.name,
                "points": []
            }
        
        if record.value is not None:
            grouped_data[record.slug]["points"].append({
                "date": record.date,
                "value": record.value,
                "unit": record.unit,
                "analysis_uid": record.analysis.uid
            })
            
    response = []
    for slug, info in grouped_data.items():
        if info["points"]:
            response.append({
                "slug": slug,
                "name": info["name"],
                "data": info["points"]
            })
            
    return response

@api.get("/patients/{patient_id}/analyses", response=List[AnalysisResponseSchema], auth=JWTAuth())
def get_patient_analyses(request, patient_id: int):
    """
    Получить список всех анализов конкретного профиля (пациента).
    """
    profile = get_object_or_404(PatientProfile, id=patient_id, user=request.user)
    # Возвращаем анализы, отсортированные по дате создания (новые сверху)
    return MedicalAnalysis.objects.filter(patient=profile).order_by('-created_at')

@api.get("/analyses/{uid}", response=AnalysisResponseSchema, auth=JWTAuth())
def get_analysis_result(request, uid: uuid.UUID):
    print(f"🔍 API: Запрос анализа {uid} от пользователя {request.user.email}")
    
    # 1. Пытаемся найти анализ по UID
    try:
        analysis = MedicalAnalysis.objects.get(uid=uid)
    except MedicalAnalysis.DoesNotExist:
        print(f"❌ API: Анализ {uid} не найден в БД!")
        raise Http404("Анализ не найден")

    # 2. Проверка прав (если анализ не анонимный, а пользователя мы знаем)
    if analysis.user and analysis.user != request.user:
        print(f"⛔ API: Доступ запрещен. Владелец: {analysis.user}, Запрос от: {request.user}")
        # Можно вернуть 403, но 404 безопаснее, чтобы не палить существование
        raise Http404("Анализ не найден или доступ запрещен")

    print(f"✅ API: Анализ найден, статус: {analysis.status}")
    return analysis

@api.delete("/analyses/{uid}", auth=JWTAuth())
def delete_analysis(request, uid: uuid.UUID):
    """
    Удалить анализ.
    """
    analysis = get_object_or_404(MedicalAnalysis, uid=uid)
    
    # Проверка прав: удалять может только владелец
    if analysis.user != request.user:
        return api.create_response(request, {"message": "Доступ запрещен"}, status=403)

    # Удаляем файл с диска (опционально, Django обычно удаляет только запись, 
    # но для чистоты можно и файл почистить, если настроен cleanup)
    analysis.delete()
    
    return {"success": True}

@api.get("/analyses/{uid}/download", auth=JWTAuth())
def download_analysis_file(request, uid: uuid.UUID):
    """
    Получить исходный файл анализа (PDF или изображение).
    """
    # 1. Ищем анализ
    analysis = get_object_or_404(MedicalAnalysis, uid=uid)
    
    # 2. Проверка прав (защита от чужих глаз)
    if analysis.user and analysis.user != request.user:
        print(f"⛔ API: Доступ к файлу запрещен. Владелец: {analysis.user}, Запрос от: {request.user}")
        raise Http404("Файл не найден")

    # 3. Проверяем, есть ли сам файл физически
    if not analysis.file:
        print(f"❌ API: Файл для анализа {uid} отсутствует в БД.")
        raise Http404("Файл не найден")

    # 4. Отдаем файл
    response = FileResponse(analysis.file.open('rb'))
    fname = analysis.file.name.split("/")[-1]
    
    # Указываем inline, чтобы браузер мог его прочитать прямо во вкладке, 
    # а фронтенд корректно сгенерировал Blob
    response['Content-Disposition'] = f'inline; filename="{fname}"'
    
    
@api.put("/profiles/{profile_id}", response=PatientProfileSchema, auth=JWTAuth())
def update_profile(request, profile_id: int, payload: UpdateProfileSchema):
    profile = get_object_or_404(PatientProfile, id=profile_id, user=request.user)
    
    # Защита базового профиля от переименования
    if profile.full_name == "Анализы" or "Основной" in profile.full_name:
        return api.create_response(request, {"message": "Базовый профиль переименовать нельзя"}, status=400)
        
    profile.full_name = payload.full_name
    profile.save(update_fields=['full_name'])
    return profile