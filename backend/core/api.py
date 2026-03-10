import uuid
import json
import random
from typing import List, Optional
from ninja import NinjaAPI, UploadedFile, File, Schema, Form
from ninja.security import HttpBearer
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth
from cms.api import cms_router

# Django imports
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.http import FileResponse, Http404, HttpRequest
from typing import Optional, Any
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from django.core.cache import cache

# JWT imports
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.tokens import RefreshToken, AccessToken
from ninja_jwt.exceptions import InvalidToken, TokenError

# Local imports
from .models import MedicalAnalysis, PatientProfile, User, AnalysisIndicator
from .schemas import (
    AnalysisResponseSchema,
    AuthResponseSchema,
    PatientProfileSchema,
    CreateProfileSchema,
    AssignProfileRequest,
    ChartResponseSchema,
    RefreshRequestSchema,
    ClaimRequestOTPSchema,
    ClaimVerifyOTPSchema,
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
api.add_router("/cms/", cms_router)

class OptionalJWTAuth(JWTAuth):
    """
    Кастомный класс авторизации. 
    Если токен есть и он валиден - авторизует. 
    Если токена нет - просто пропускает как анонима, без ошибки 401.
    """
    def __call__(self, request: HttpRequest) -> Optional[Any]:
        try:
            return super().__call__(request)
        except Exception:
            return None

# ==========================================
# 1. АВТОРИЗАЦИЯ И УПРАВЛЕНИЕ АККАУНТОМ
# ==========================================

@api.post("/auth/register", response=AuthResponseSchema)
def register(request, payload: RegisterSchema):
    if User.objects.filter(email=payload.email).exists():
        return api.create_response(request, {"message": "Пользователь с таким email уже существует"}, status=400)
    
    with transaction.atomic():
        user = User.objects.create(email=payload.email, phone=payload.phone)
        # Упрощенная генерация: 6 цифр, если пароль не передан
        password = payload.password or get_random_string(6, allowed_chars='0123456789')
        user.set_password(password)
        user.save()
        
        PatientProfile.objects.create(user=user, full_name="Основной профиль")
        
        if not payload.password:
            try:
                send_mail(
                    subject='Регистрация в DataDoctor.pro',
                    message=f'Добро пожаловать в DataDoctor.pro!\n\nВаши данные для входа:\nЛогин: {user.email}\nВаш пароль: {password}\n\nПожалуйста, сохраните эти данные или смените пароль в личном кабинете.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True, 
                )
            except Exception as e:
                print(f"❌ Ошибка отправки письма при регистрации: {e}")

    refresh = RefreshToken.for_user(user)
    return {
        "token": str(refresh.access_token),
        "refresh_token": str(refresh),
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
        "refresh_token": str(refresh),
        "user_email": user.email
    }

@api.post("/auth/claim-request")
def claim_request(request, payload: ClaimRequestOTPSchema):
    # Проверяем все анализы сразу
    analyses = MedicalAnalysis.objects.filter(uid__in=payload.analysis_uids)
    if not analyses.exists():
        raise Http404("Анализы не найдены")

    user = User.objects.filter(email=payload.email).first()

    with transaction.atomic():
        if not user:
            user = User.objects.create(email=payload.email, phone=payload.phone)
            pin_code = get_random_string(6, allowed_chars='0123456789')
            user.set_password(pin_code)
            user.save()
            PatientProfile.objects.create(user=user, full_name="Основной профиль")

            try:
                send_mail(
                    subject='Код доступа к результатам | DataDoctor.pro',
                    message=f'Ваши анализы готовы!\n\nВаш PIN-код для просмотра результатов: {pin_code}\n\nНикому не сообщайте этот код.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"❌ Ошибка отправки письма: {e}")

            return {"message": "PIN-код отправлен на почту", "status": "pin_sent"}
        else:
            return {"message": "Email найден. Введите пароль.", "status": "requires_password"}

@api.post("/auth/claim-verify", response=AuthResponseSchema)
def claim_verify(request, payload: ClaimVerifyOTPSchema):
    pwd = getattr(payload, 'password', None) or getattr(payload, 'code', None)
    user = authenticate(username=payload.email, password=pwd)
    if not user:
        return api.create_response(request, {"message": "Неверный код или пароль"}, status=401)

    analyses = MedicalAnalysis.objects.filter(uid__in=payload.analysis_uids)
    
    # Защита от двойной привязки
    for analysis in analyses:
        if analysis.user and analysis.user != user:
            return api.create_response(request, {"message": "Один из анализов уже привязан к другому аккаунту"}, status=400)

    patient_profile = PatientProfile.objects.filter(user=user).first()
    
    with transaction.atomic():
        for analysis in analyses:
            if not analysis.user:
                analysis.user = user
                analysis.patient = patient_profile
                analysis.save(update_fields=['user', 'patient'])
                AnalysisIndicator.objects.filter(analysis=analysis).update(patient=patient_profile)

    # ИЗМЕНЕНИЕ: Ищем только ПЕРВЫЙ анализ, который висит в PENDING, и пинаем его.
    first_pending = analyses.filter(status=MedicalAnalysis.Status.PENDING).first()
    if first_pending:
        process_analysis_task.delay(first_pending.uid)

    refresh = RefreshToken.for_user(user)
    return {
        "token": str(refresh.access_token),
        "refresh_token": str(refresh),
        "user_email": user.email
    }


@api.post("/auth/refresh")
def refresh_token(request, payload: RefreshRequestSchema):
    try:
        refresh = RefreshToken(payload.refresh)
        return {"access": str(refresh.access_token)}
    except TokenError:
        return api.create_response(request, {"message": "Токен устарел или недействителен"}, status=401)

# --- Восстановление пароля ---
@api.post("/auth/reset-password-request")
def reset_password_request(request, payload: ResetPasswordRequestSchema):
    try:
        user = User.objects.get(email=payload.email)
    except User.DoesNotExist:
        return {"message": "Если такой email существует, мы отправили инструкцию."}

    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    domain = "https://bimark.org" 
    reset_link = f"{domain}/auth/reset-password?uid={uid}&token={token}"
    
    try:
        send_mail(
            subject='Восстановление пароля DataDoctor.pro',
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

@api.post("/analyses/upload", response=AnalysisResponseSchema, auth=None)
def upload_analysis(request, file: UploadedFile = File(...), is_first: bool = Form(True)):
    user = None
    patient_profile = None 
    
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token_str = auth_header.split(' ')[1]
        try:
            access_token = AccessToken(token_str)
            user = User.objects.get(id=access_token['user_id'])
        except (TokenError, User.DoesNotExist):
            pass
            
    if user and user.is_authenticated:
        patient_profile = PatientProfile.objects.filter(user=user).first()
        if not patient_profile:
             patient_profile = PatientProfile.objects.create(
                 user=user, full_name="Я (Основной профиль)"
             )

    analysis = MedicalAnalysis.objects.create(
        file=file,
        user=user if user and user.is_authenticated else None,
        patient=patient_profile,
        status=MedicalAnalysis.Status.PENDING
    )
    
    # ИЗМЕНЕНИЕ: Независимо от авторизации, мы отправляем в Celery ТОЛЬКО первый файл.
    # Остальные файлы лягут в БД со статусом PENDING и будут запущены по цепочке!
    if is_first:
        transaction.on_commit(lambda: process_analysis_task.delay(analysis.uid))
        
    return analysis

# ---------------------------------------------------------

@api.get("/analyses/{uid}", response=AnalysisResponseSchema, auth=None)
def get_analysis_result(request, uid: uuid.UUID):
    try:
        analysis = MedicalAnalysis.objects.get(uid=uid)
    except MedicalAnalysis.DoesNotExist:
        raise Http404("Анализ не найден")

    # Доступ по UUID открыт для всех (т.к. UUID - это как секретная ссылка)
    return analysis

@api.get("/analyses/{uid}/download", auth=None)
def download_analysis_file(request, uid: uuid.UUID):
    analysis = get_object_or_404(MedicalAnalysis, uid=uid)

    if not analysis.file:
        raise Http404("Файл не найден")

    # Доступ к файлу по UUID также открыт
    response = FileResponse(analysis.file.open('rb'))
    fname = analysis.file.name.split("/")[-1]
    response['Content-Disposition'] = f'inline; filename="{fname}"'
    return response

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
    
    if profile.full_name == "Анализы" or "Основной" in profile.full_name:
        return api.create_response(request, {"message": "Базовый профиль удалить нельзя"}, status=400)
        
    profile.delete()
    return {"success": True}

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
            grouped_data[record.slug] = {"name": record.name, "points": []}
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
            response.append({"slug": slug, "name": info["name"], "data": info["points"]})
            
    return response

@api.get("/patients/{patient_id}/analyses", response=List[AnalysisResponseSchema], auth=JWTAuth())
def get_patient_analyses(request, patient_id: int):
    profile = get_object_or_404(PatientProfile, id=patient_id, user=request.user)
    return MedicalAnalysis.objects.filter(patient=profile).order_by('-created_at')

@api.delete("/analyses/{uid}", auth=JWTAuth())
def delete_analysis(request, uid: uuid.UUID):
    analysis = get_object_or_404(MedicalAnalysis, uid=uid)
    if analysis.user != request.user:
        return api.create_response(request, {"message": "Доступ запрещен"}, status=403)

    analysis.delete()
    return {"success": True}

@api.put("/profiles/{profile_id}", response=PatientProfileSchema, auth=JWTAuth())
def update_profile(request, profile_id: int, payload: UpdateProfileSchema):
    profile = get_object_or_404(PatientProfile, id=profile_id, user=request.user)
    
    if profile.full_name == "Анализы" or "Основной" in profile.full_name:
        return api.create_response(request, {"message": "Базовый профиль переименовать нельзя"}, status=400)
        
    profile.full_name = payload.full_name
    profile.save(update_fields=['full_name'])
    return profile