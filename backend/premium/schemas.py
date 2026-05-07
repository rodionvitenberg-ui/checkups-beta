# backend/premium/schemas.py

from ninja import Schema
from typing import List, Optional
from datetime import datetime

# Схема для справочника черт (Диабет, Курение и т.д.)
class TraitSchema(Schema):
    id: int
    name: str
    category: str
    is_custom: bool

# Схема для создания кастомной черты юзером
class CreateCustomTraitSchema(Schema):
    name: str
    category: str

# Схема для привязки черты к пациенту (та самая "промежуточная таблица")
class LinkTraitSchema(Schema):
    trait_id: int
    details: str  # Текстовое поле для стажа, дозировок и прочего

# Схема для отдачи привязанных черт на фронтенд
class PatientTraitLinkSchema(Schema):
    id: int
    trait: TraitSchema
    details: Optional[str] = None
    created_at: datetime