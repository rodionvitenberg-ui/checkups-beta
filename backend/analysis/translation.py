from modeltranslation.translator import register, TranslationOptions
from .models import PromptTemplate

@register(PromptTemplate)
class PromptTemplateTranslationOptions(TranslationOptions):
    # Указываем, что переводим сам промпт и контекст (примеры)
    fields = ('system_prompt', 'context_data')