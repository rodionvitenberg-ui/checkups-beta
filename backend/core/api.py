import uuid
import json
import random
from typing import List, Optional
from ninja import NinjaAPI, UploadedFile, File, Schema, Form
from ninja.security import HttpBearer
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth

# Django imports
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.http import FileResponse, Http404, HttpRequest, StreamingHttpResponse
from analysis.services import ChatAssistant
from typing import Optional, Any
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from django.core.cache import cache
from django.utils.translation import gettext as _ # ДОБАВЛЕНО ДЛЯ ЛОКАЛИЗАЦИИ

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
    UpdateProfileSchema,
    ChatMessageSchema,
    ChatRequestSchema
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

class ChangePasswordSchema(Schema):
    old_password: str
    new_password: str   

# --- Инициализация API ---

api = NinjaAPI()
User = get_user_model()

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
        return api.create_response(request, {"message": _("Пользователь с таким email уже существует")}, status=400)
    
    with transaction.atomic():
        user = User.objects.create(email=payload.email, phone=payload.phone)
        password = payload.password or get_random_string(6, allowed_chars='0123456789')
        user.set_password(password)
        user.save()
        
        # Переводим название дефолтного профиля
        PatientProfile.objects.create(user=user, full_name=_("Основной профиль"))
        
        if not payload.password:
            try:
                # Шаблон письма вынесен в gettext
                mail_subject = _("Регистрация в DataDoctor.pro")
                mail_message = _("Добро пожаловать в DataDoctor.pro!\n\nВаши данные для входа:\nЛогин: {email}\nВаш пароль: {password}\n\nПожалуйста, сохраните эти данные или смените пароль в личном кабинете.").format(email=user.email, password=password)
                
                send_mail(
                    subject=mail_subject,
                    message=mail_message,
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
        return api.create_response(request, {"message": _("Неверный email или пароль")}, status=401)
    
    refresh = RefreshToken.for_user(user)
    return {
        "token": str(refresh.access_token),
        "refresh_token": str(refresh),
        "user_email": user.email
    }

@api.post("/auth/claim-request")
def claim_request(request, payload: ClaimRequestOTPSchema):
    analyses = MedicalAnalysis.objects.filter(uid__in=payload.analysis_uids)
    if not analyses.exists():
        raise Http404(_("Анализы не найдены"))

    user = User.objects.filter(email=payload.email).first()

    with transaction.atomic():
        if not user:
            user = User.objects.create(email=payload.email, phone=payload.phone)
            pin_code = get_random_string(6, allowed_chars='0123456789')
            user.set_password(pin_code)
            user.save()
            PatientProfile.objects.create(user=user, full_name=_("Основной профиль"))

            try:
                mail_subject = _("Код доступа к результатам | DataDoctor.pro")
                mail_message = _("Ваши анализы готовы!\n\nВаш PIN-код для просмотра результатов: {pin_code}\n\nНикому не сообщайте этот код.").format(pin_code=pin_code)
                
                send_mail(
                    subject=mail_subject,
                    message=mail_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"❌ Ошибка отправки письма: {e}")

            return {"message": _("PIN-код отправлен на почту"), "status": "pin_sent"}
        else:
            return {"message": _("Email найден. Введите пароль."), "status": "requires_password"}

@api.post("/auth/claim-verify", response=AuthResponseSchema)
def claim_verify(request, payload: ClaimVerifyOTPSchema):
    pwd = getattr(payload, 'password', None) or getattr(payload, 'code', None)
    user = authenticate(username=payload.email, password=pwd)
    if not user:
        return api.create_response(request, {"message": _("Неверный код или пароль")}, status=401)

    analyses = MedicalAnalysis.objects.filter(uid__in=payload.analysis_uids)
    
    with transaction.atomic():
        for analysis in analyses:
            if not analysis.user:
                analysis.user = user
                
                # Если у анализа есть профиль-сирота, привязываем его к юзеру
                if analysis.patient and analysis.patient.user is None:
                    # Проверяем, нет ли уже у юзера профиля с таким же именем
                    existing_profile = PatientProfile.objects.filter(user=user, full_name=analysis.patient.full_name).first()
                    
                    if existing_profile:
                        # Если профиль с таким именем уже есть (например, юзер создал его вручную), 
                        # перепривязываем анализ к существующему, а сироту удаляем
                        old_orphan = analysis.patient
                        analysis.patient = existing_profile
                        analysis.save(update_fields=['user', 'patient'])
                        old_orphan.delete()
                    else:
                        # Если такого профиля нет, просто "усыновляем" сироту
                        analysis.patient.user = user
                        analysis.patient.save(update_fields=['user'])
                        analysis.save(update_fields=['user'])
                else:
                    # Если профиля не было совсем, привязываем к основному
                    main_profile = PatientProfile.objects.filter(user=user).order_by('created_at').first()
                    analysis.patient = main_profile
                    analysis.save(update_fields=['user', 'patient'])

                # Обновляем записи в истории, чтобы они тоже принадлежали пациенту
                AnalysisIndicator.objects.filter(analysis=analysis).update(patient=analysis.patient)

    first_pending = analyses.filter(status=MedicalAnalysis.Status.PENDING).first()
    if first_pending:
        # Прокидываем текущий язык в таску!
        lang = getattr(request, 'LANGUAGE_CODE', 'en')
        transaction.on_commit(lambda: process_analysis_task.delay(first_pending.uid, lang))

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
        return api.create_response(request, {"message": _("Токен устарел или недействителен")}, status=401)

# --- Восстановление пароля ---
@api.post("/auth/reset-password-request")
def reset_password_request(request, payload: ResetPasswordRequestSchema):
    try:
        user = User.objects.get(email=payload.email)
    except User.DoesNotExist:
        # Мы не переводим это сообщение, чтобы злоумышленник не мог "прощупывать" базу
        return {"message": _("Если такой email существует, мы отправили инструкцию.")}

    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    domain = "https://datadoctor.pro" # ИСПРАВЛЕНИЕ: Заменил bimark.org на предполагаемый твой
    reset_link = f"{domain}/auth/reset-password?uid={uid}&token={token}"
    
    try:
        mail_subject = _("Восстановление пароля DataDoctor.pro")
        mail_message = _("Вы запросили сброс пароля.\nДля установки нового пароля перейдите по ссылке:\n{reset_link}\n\nЕсли вы не запрашивали это действие, просто проигнорируйте письмо.").format(reset_link=reset_link)
        
        send_mail(
            subject=mail_subject,
            message=mail_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception as e:
        print(f"❌ Ошибка отправки письма при сбросе: {e}")
    
    return {"message": _("Инструкция по сбросу пароля отправлена на Email.")}

@api.post("/auth/reset-password-confirm")
def reset_password_confirm(request, payload: ResetPasswordConfirmSchema):
    try:
        uid = force_str(urlsafe_base64_decode(payload.uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return api.create_response(request, {"message": _("Неверная ссылка")}, status=400)

    if not default_token_generator.check_token(user, payload.token):
        return api.create_response(request, {"message": _("Ссылка устарела или недействительна")}, status=400)

    user.set_password(payload.new_password)
    user.save()
    return {"message": _("Пароль успешно изменен. Теперь вы можете войти.")}

@api.post("/auth/change-password", auth=JWTAuth())
def change_password(request, payload: ChangePasswordSchema):
    user = request.user
    
    if not user.check_password(payload.old_password):
        return api.create_response(request, {"message": _("Неверный текущий пароль")}, status=400)
    
    user.set_password(payload.new_password)
    user.save()
    
    return {"message": _("Пароль успешно изменен")}

# ==========================================
# 2. РАБОТА С АНАЛИЗАМИ (Гибридный доступ)
# ==========================================

@api.post("/analyses/upload", response=AnalysisResponseSchema, auth=None)
def upload_analysis(
    request, 
    file: UploadedFile = File(...), 
    is_first: bool = Form(True),
    patient_id: str = Form(None),   
    guest_name: str = Form(None),
    guest_gender: str = Form(None),
    guest_dob: str = Form(None)
):
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
    
    print(f"🕵️ ДЕБАГ ЗАГРУЗКИ: user={user}, patient_id='{patient_id}', guest_name='{guest_name}'")
            
    if user and user.is_authenticated:
        if patient_id and patient_id != 'new':
            # Выбрали существующего пациента
            try:
                patient_profile = get_object_or_404(PatientProfile, id=int(patient_id), user=user)
            except ValueError:
                pass
        elif patient_id == 'new' and guest_name:
            # АВТОРИЗОВАННЫЙ юзер создает новый профиль прямо при загрузке
            patient_profile = PatientProfile.objects.create(
                user=user,
                full_name=guest_name,
                gender=guest_gender if guest_gender in ['M', 'F'] else None,
                birth_date=guest_dob if guest_dob else None
            )
        else:
            # Дефолтный фолбэк
            patient_profile = PatientProfile.objects.filter(user=user).order_by('created_at').first()
    else:
        # ГОСТЬ (Сирота)
        if guest_name:
            patient_profile = PatientProfile.objects.create(
                user=None,
                full_name=guest_name,
                gender=guest_gender if guest_gender in ['M', 'F'] else None,
                birth_date=guest_dob if guest_dob else None
            )

    analysis = MedicalAnalysis.objects.create(
        file=file,
        user=user if user and user.is_authenticated else None,
        patient=patient_profile,
        status=MedicalAnalysis.Status.PENDING
    )
    
    if is_first:
        lang = getattr(request, 'LANGUAGE_CODE', 'en')
        transaction.on_commit(lambda: process_analysis_task.delay(analysis.uid, lang))
        
    return analysis
# ---------------------------------------------------------

@api.get("/analyses/{uid}", response=AnalysisResponseSchema, auth=None)
def get_analysis_result(request, uid: uuid.UUID):
    try:
        analysis = MedicalAnalysis.objects.get(uid=uid)
    except MedicalAnalysis.DoesNotExist:
        raise Http404(_("Анализ не найден"))

    return analysis

@api.get("/analyses/{uid}/download", auth=None)
def download_analysis_file(request, uid: uuid.UUID):
    analysis = get_object_or_404(MedicalAnalysis, uid=uid)

    if not analysis.file:
        raise Http404(_("Файл не найден"))

    response = FileResponse(analysis.file.open('rb'))
    fname = analysis.file.name.split("/")[-1]
    response['Content-Disposition'] = f'inline; filename="{fname}"'
    return response

@api.post("/analyses/{uid}/reanalyze", response=AnalysisResponseSchema, auth=None)
def reanalyze_document(request, uid: uuid.UUID):
    old_analysis = get_object_or_404(MedicalAnalysis, uid=uid)
    
    new_analysis = MedicalAnalysis.objects.create(
        file=old_analysis.file,
        user=old_analysis.user,
        patient=old_analysis.patient,
        parent_analysis=old_analysis,
        status=MedicalAnalysis.Status.PENDING
    )
    
    lang = getattr(request, 'LANGUAGE_CODE', 'en')
    transaction.on_commit(lambda: process_analysis_task.delay(new_analysis.uid, lang))
    
    return new_analysis

# ==========================================
# 3. ЛИЧНЫЙ КАБИНЕТ (Защищено JWT)
# ==========================================

@api.get("/profiles", response=List[PatientProfileSchema], auth=JWTAuth())
def list_profiles(request):
    return PatientProfile.objects.filter(user=request.user).order_by('created_at')

@api.post("/profiles", response=PatientProfileSchema, auth=JWTAuth())
def create_profile(request, payload: CreateProfileSchema):
    profile = PatientProfile.objects.create(
        user=request.user,
        full_name=payload.full_name,
        birth_date=payload.birth_date,
        gender=payload.gender,
        weight=payload.weight,
        height=payload.height,
        lifestyle=payload.lifestyle,
        chronic_diseases=payload.chronic_diseases
    )
    return profile

@api.put("/profiles/{profile_id}", response=PatientProfileSchema, auth=JWTAuth())
def update_profile(request, profile_id: int, payload: UpdateProfileSchema):
    profile = get_object_or_404(PatientProfile, id=profile_id, user=request.user)
    
    # ИСПРАВЛЕНИЕ УЯЗВИМОСТИ: Проверяем по дате создания, а не по названию
    first_profile = PatientProfile.objects.filter(user=request.user).order_by('created_at').first()
    
    if profile.id == first_profile.id and profile.full_name != payload.full_name:
        return api.create_response(request, {"message": _("Базовый профиль переименовать нельзя")}, status=400)
        
    profile.full_name = payload.full_name
    profile.birth_date = payload.birth_date
    profile.gender = payload.gender
    profile.weight = payload.weight
    profile.height = payload.height
    profile.lifestyle = payload.lifestyle
    profile.chronic_diseases = payload.chronic_diseases
    profile.save()
    return profile

@api.delete("/profiles/{profile_id}", auth=JWTAuth())
def delete_patient_profile(request, profile_id: int):
    # Находим профиль, принадлежащий именно этому пользователю
    profile = get_object_or_404(PatientProfile, id=profile_id, user=request.user)
    
    # Защита: не позволяем удалить основной профиль
    first_profile = PatientProfile.objects.filter(user=request.user).order_by('created_at').first()
    if profile.id == first_profile.id:
        return api.create_response(
            request, 
            {"message": _("Основной профиль нельзя удалить")}, 
            status=400
        )
        
    # Благодаря on_delete=models.CASCADE в моделях, 
    # все связанные анализы и показатели удалятся автоматически
    profile.delete()
    
    return {"success": True, "message": _("Профиль успешно удален")}

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
        return api.create_response(request, {"message": _("Доступ запрещен")}, status=403)

    analysis.delete()
    return {"success": True}

@api.post("/analyses/{uid}/chat", auth=JWTAuth())
def chat_with_analysis(request, uid: uuid.UUID, payload: ChatRequestSchema):
    analysis = get_object_or_404(MedicalAnalysis, uid=uid)
    
    # Защита: общаться можно только со своими анализами
    if analysis.user != request.user:
        return api.create_response(request, {"message": _("Доступ запрещен")}, status=403)

    if not analysis.ai_result:
        return api.create_response(request, {"message": _("Анализ еще не расшифрован")}, status=400)

    # 1. Собираем пациентский контекст СТРОГО для этого анализа
    context_lines = []
    if analysis.patient:
        if analysis.patient.gender:
            context_lines.append(f"Пол: {analysis.patient.get_gender_display()}")
        if analysis.patient.birth_date:
            context_lines.append(f"Дата рождения: {analysis.patient.birth_date}")
        if analysis.patient.weight and analysis.patient.height:
            context_lines.append(f"Вес: {analysis.patient.weight} кг, Рост: {analysis.patient.height} см")
        
        # Добавляем особенности (PRO), если есть
        try:
            premium_traits = analysis.patient.premium_traits.all()
            if premium_traits.exists():
                context_lines.append("Особенности здоровья:")
                for link in premium_traits:
                    context_lines.append(f"- {link.trait.name}: {link.details or 'не указано'}")
        except Exception:
            pass

    patient_context = "\n".join(context_lines)

    # 2. Инициализируем стриминг
    lang = getattr(request, 'LANGUAGE_CODE', 'ru')
    assistant = ChatAssistant(language_code=lang)
    
    # 3. Функция-генератор для формата Server-Sent Events (SSE)
    def event_stream():
        stream_generator = assistant.stream_chat(
            analysis_data=analysis.ai_result, 
            patient_context=patient_context, 
            chat_history=payload.messages
        )
        for chunk in stream_generator:
            # Формат SSE: "data: <содержимое>\n\n"
            # Заменяем переносы строк, чтобы не сломать протокол SSE
            clean_chunk = chunk.replace("\n", "\\n")
            yield f"data: {clean_chunk}\n\n"
        
        # Сигнал окончания потока
        yield "data: [DONE]\n\n"

    return StreamingHttpResponse(event_stream(), content_type='text/event-stream')

api.add_router("/premium", "premium.api.router")