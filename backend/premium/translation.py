from modeltranslation.translator import register, TranslationOptions
from .models import Trait

@register(Trait)
class TraitTranslationOptions(TranslationOptions):
    fields = ('name',)