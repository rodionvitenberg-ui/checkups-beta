from celery import shared_task
from django.db import transaction
from core.models import MedicalAnalysis
from core.llm import LLMClient
from .models import ChatMessage, ChatSettings

@shared_task
def summarize_chat_history_task(analysis_uid):
    """
    Фоновая задача для сжатия старых сообщений чата.
    Срабатывает, если длина неархивированных сообщений превышает лимит.
    """
    settings = ChatSettings.get_settings()
    if not settings.optimize_tokens:
        return "Optimization disabled"

    analysis = MedicalAnalysis.objects.filter(uid=analysis_uid).first()
    if not analysis:
        return "Analysis not found"

    # Берем все НЕархивированные сообщения, КРОМЕ 4-х последних (чтобы ИИ помнил свежий контекст дословно)
    unsummarized_msgs = ChatMessage.objects.filter(
        analysis=analysis, 
        is_summarized=False
    ).order_by('created_at')

    if unsummarized_msgs.count() <= 4:
        return "Not enough messages to summarize"

    # Оставляем последние 4 сообщения нетронутыми
    msgs_to_summarize = list(unsummarized_msgs)[:-4]
    
    # Проверяем объем текста (например, если символов меньше 2000, не тратим токены на сжатие)
    text_to_compress = "\n".join([f"{m.role}: {m.content}" for m in msgs_to_summarize])
    if len(text_to_compress) < 2000:
        return "Context is still small"

    # Делегируем LLM-клиенту (единый пул ключей/ротация/retry)
    llm = LLMClient(base_url="https://api.deepseek.com", model_name="deepseek-chat")
    if not llm.has_keys:
        return "No API key"

    # Промпт для сжатия
    system_prompt = (
        "Ты — медицинский архивариус. Твоя задача — обновить краткое содержание истории болезни пациента. "
        "Тебе дано ТЕКУЩЕЕ КРАТКОЕ СОДЕРЖАНИЕ и НОВЫЕ СООБЩЕНИЯ. "
        "Напиши новое, объединенное краткое содержание. "
        "Сохраняй только важные медицинские факты, жалобы, упомянутые показатели и данные рекомендации. "
        "Удали всю воду, приветствия и эмоции. Пиши от 3-го лица сжато."
    )
    
    current_summary = analysis.chat_summary or "История пуста."
    user_prompt = f"ТЕКУЩЕЕ КРАТКОЕ СОДЕРЖАНИЕ:\n{current_summary}\n\nНОВЫЕ СООБЩЕНИЯ:\n{text_to_compress}"

    try:
        new_summary = llm.complete(system_prompt, user_prompt, temperature=0.1)
        
        # Сохраняем атомарно (чтобы избежать гонки данных)
        with transaction.atomic():
            # Обновляем саммери в анализе
            analysis.chat_summary = new_summary
            analysis.save(update_fields=['chat_summary'])
            
            # Помечаем сообщения как сжатые
            for msg in msgs_to_summarize:
                msg.is_summarized = True
                msg.save(update_fields=['is_summarized'])
                
        return "Summarization complete"

    except Exception as e:
        print(f"Summarization error: {e}")
        return str(e)