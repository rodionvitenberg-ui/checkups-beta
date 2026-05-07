import uuid # Исправлено: импортируем стандартный uuid, а не из celery
from typing import List
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext as _
from ninja import Router
from ninja_jwt.authentication import JWTAuth
from .tasks import summarize_chat_history_task

from core.models import MedicalAnalysis
from .models import Trait, PatientTraitLink, ChatMessage
from .schemas import (
    TraitSchema, 
    CreateCustomTraitSchema, 
    LinkTraitSchema, 
    PatientTraitLinkSchema,
    ChatRequestSchema,
    ChatMessageResponseSchema
)
from .services import ChatAssistant

# Создаем роутер. Нам НЕ НУЖЕН здесь объект NinjaAPI
router = Router(auth=JWTAuth())
# --- ЭНДПОИНТЫ ХАРАКТЕРИСТИК (Traits) ---

@router.get("/traits", response=List[TraitSchema])
def list_traits(request):
    """Список доступных характеристик (системные + кастомные юзера)"""
    traits = Trait.objects.filter(is_custom=False) | Trait.objects.filter(created_by=request.user)
    return traits.order_by('category', 'name')

@router.post("/traits/custom", response=TraitSchema)
def create_custom_trait(request, payload: CreateCustomTraitSchema):
    """Создание своей характеристики"""
    trait = Trait.objects.create(
        name=payload.name,
        category=payload.category,
        is_custom=True,
        created_by=request.user
    )
    return trait

@router.post("/patients/{patient_id}/traits", response=PatientTraitLinkSchema)
def link_patient_trait(request, patient_id: int, payload: LinkTraitSchema):
    """Привязка характеристики к профилю пациента"""
    from core.models import PatientProfile
    profile = get_object_or_404(PatientProfile, id=patient_id, user=request.user)
    trait = get_object_or_404(Trait, id=payload.trait_id)
    
    link = PatientTraitLink.objects.create(
        patient=profile,
        trait=trait,
        details=payload.details
    )
    return link

@router.delete("/patients/traits/{link_id}")
def remove_patient_trait(request, link_id: int):
    """Удаление характеристики у пациента"""
    link = get_object_or_404(PatientTraitLink, id=link_id, patient__user=request.user)
    link.delete()
    return {"success": True}

@router.get("/patients/{patient_id}/traits", response=List[PatientTraitLinkSchema])
def get_patient_traits(request, patient_id: int):
    """Получение всех характеристик конкретного пациента"""
    from core.models import PatientProfile
    profile = get_object_or_404(PatientProfile, id=patient_id, user=request.user)
    return profile.premium_traits.all()


# --- ЭНДПОИНТЫ ИИ-ЧАТА (Chat) ---

@router.get("/analyses/{uid}/chat", response=List[ChatMessageResponseSchema])
def get_chat_history(request, uid: str):
    """Загрузка истории переписки по анализу из БД"""
    analysis = get_object_or_404(MedicalAnalysis, uid=uid, user=request.user)
    return analysis.chat_messages.all().order_by('created_at')

@router.post("/analyses/{uid}/chat")
def chat_with_analysis(request, uid: str, payload: ChatRequestSchema):
    """Отправка сообщения ИИ и получение потокового ответа со сохранением в БД"""
    analysis = get_object_or_404(MedicalAnalysis, uid=uid, user=request.user)
    
    if not analysis.ai_result:
        return api.create_response(request, {"message": _("Анализ еще не расшифрован")}, status=400)

    # 1. Сохраняем новое сообщение пользователя в БД
    user_msg_content = payload.messages[-1].content
    ChatMessage.objects.create(analysis=analysis, role='user', content=user_msg_content)

    # 2. Собираем историю сообщений из БД для контекста ИИ (последние 10)
    db_history_qs = analysis.chat_messages.filter(is_summarized=False).order_by('-created_at')[:15]
    db_history = list(db_history_qs)
    db_history.reverse()

    # 3. Собираем медицинский контекст (демография + характеристики)
    context_lines = []
    if analysis.patient:
        p = analysis.patient
        if p.gender: context_lines.append(f"Пол: {p.get_gender_display()}")
        if p.birth_date: context_lines.append(f"Дата рождения: {p.birth_date}")
        if p.weight and p.height:
            context_lines.append(f"Вес: {p.weight} кг, Рост: {p.height} см")
        
        traits = p.premium_traits.all()
        if traits.exists():
            context_lines.append("Особенности пациента:")
            for t in traits:
                context_lines.append(f"- {t.trait.name}: {t.details or 'без деталей'}")

    if analysis.chat_summary:
        context_lines.insert(0, f"КРАТКАЯ ИСТОРИЯ ПРОШЛЫХ ОБСУЖДЕНИЙ:\n{analysis.chat_summary}\n---")
    
    patient_context = "\n".join(context_lines)

    # 4. Стриминг ответа
    assistant = ChatAssistant(language_code=getattr(request, 'LANGUAGE_CODE', 'ru'))
    
    def event_stream():
        full_response = []
        stream_generator = assistant.stream_chat(
            analysis_data=analysis.ai_result, 
            patient_context=patient_context, 
            chat_history=db_history
        )
        for chunk in stream_generator:
            full_response.append(chunk)
            # Экранируем переносы строк для формата SSE
            yield f"data: {chunk.replace('\n', '\\n')}\n\n"
        
        # 5. Сохраняем полный ответ ИИ в БД после завершения стрима
        assistant_final_text = "".join(full_response)
        if assistant_final_text:
            ChatMessage.objects.create(
                analysis=analysis, 
                role='assistant', 
                content=assistant_final_text
            )
            
            # ЗАПУСКАЕМ ФОНОВУЮ ТАСКУ Celery!
            summarize_chat_history_task.delay(analysis.uid)
            
        yield "data: [DONE]\n\n"