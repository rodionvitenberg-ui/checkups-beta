import uuid
from ninja import Schema
from typing import List, Optional

# --- Вложенные части ответа AI ---

class SummarySchema(Schema):
    is_critical: bool
    general_comment: str

class IndicatorSchema(Schema):
    name: str
    value: str  # Str, так как может быть "не обнаружено" или "> 50"
    unit: Optional[str] = None
    ref_range: Optional[str] = None
    status: str # 'normal', 'low', 'high', 'critical'
    comment: Optional[str] = None

class CauseSchema(Schema):
    title: str
    description: str

class RecommendationSchema(Schema):
    type: str # 'lab_test', 'visit', 'lifestyle'
    text: str

# --- Главная схема результата AI ---
class AIResultSchema(Schema):
    summary: SummarySchema
    indicators: List[IndicatorSchema]
    causes: List[CauseSchema]
    recommendations: List[RecommendationSchema]

# --- Схемы для API ответов ---

class AnalysisResponseSchema(Schema):
    uid: uuid.UUID # UUID переводим в строку для JSON
    status: str
    # Встраиваем нашу AI схему.
    # Если анализ еще обрабатывается, тут будет null (None)
    ai_result: Optional[AIResultSchema] = None