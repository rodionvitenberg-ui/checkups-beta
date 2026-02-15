from ninja import NinjaAPI, UploadedFile, File, Schema
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import MedicalAnalysis
from core.schemas import AnalysisResponseSchema
from .tasks import process_analysis_task
import uuid

api = NinjaAPI()
User = get_user_model()

class ClaimRequestSchema(Schema):
    analysis_uid: uuid.UUID
    email: str
    phone: str = None

class AuthResponseSchema(Schema):
    token: str 
    user_email: str


@api.post("/analyses/upload", response=AnalysisResponseSchema)
def upload_analysis(request, file: UploadedFile = File(...)):
    user = request.user if request.user.is_authenticated else None
    
    analysis = MedicalAnalysis.objects.create(
        file=file,
        user=user,
        status=MedicalAnalysis.Status.PENDING
    )
    
    # ОТПРАВЛЯЕМ В CELERY
    # delay() - это метод Celery для асинхронного запуска
    process_analysis_task.delay(analysis.id)
    
    return analysis

@api.post("/auth/claim-analysis", response=AuthResponseSchema)
def claim_analysis(request, payload: ClaimRequestSchema):
    """
    2. Превращение анонимного пользователя в зарегистрированного.
    Срабатывает после того, как AI закончил работу и юзер ввел Email.
    """
    analysis = get_object_or_404(MedicalAnalysis, uid=payload.analysis_uid)
    
    if analysis.user:
        return api.create_response(request, {"message": "Анализ уже привязан"}, status=400)

    # Проверяем, есть ли юзер. Если нет - создаем.
    user, created = User.objects.get_or_create(email=payload.email)
    
    if created:
        # Генерируем пароль
        password = User.objects.make_random_password()
        user.set_password(password)
        user.phone = payload.phone
        user.save()
        
        # TODO: Отправка Email с паролем (SendGrid / SMTP)
        print(f"📧 EMAIL TO {user.email}: Ваш пароль: {password}")
    
    # Привязываем анализ к юзеру
    analysis.user = user
    analysis.save()
    
    # Генерация токена для входа (заглушка, позже подключим JWT)
    fake_token = f"jwt-token-for-{user.id}"
    
    return {"token": fake_token, "user_email": user.email}

@api.get("/analyses/{uid}", response=AnalysisResponseSchema)
def get_analysis_result(request, uid: uuid.UUID):
    """
    3. Получение результатов.
    Фронт будет поллить этот эндпоинт, пока status != processing.
    """
    analysis = get_object_or_404(MedicalAnalysis, uid=uid)
    
    # Важно: Секьюрити чек. Если анализ уже чей-то, а запрос от анонима - 403.
    if analysis.user and request.user != analysis.user:
         return api.create_response(request, {"message": "Доступ запрещен"}, status=403)
         
    return analysis