import uuid
import datetime
from ninja import Schema
from typing import List, Optional

class PatientMetadataSchema(Schema):
    extracted_name: Optional[str] = None
    extracted_birth_date: Optional[str] = None
    extracted_gender: Optional[str] = None 

class SummarySchema(Schema):
    is_critical: bool
    general_comment: str

class IndicatorSchema(Schema):
    name: str
    slug: Optional[str] = None
    value: str
    unit: Optional[str] = None
    ref_range: Optional[str] = None
    status: str 
    comment: Optional[str] = None

class CauseSchema(Schema):
    title: str
    description: str

class RecommendationSchema(Schema):
    type: str
    text: str

class AIResultSchema(Schema):
    reasoning: str 
    
    patient_info: Optional[PatientMetadataSchema] = None 
    summary: SummarySchema
    indicators: List[IndicatorSchema]
    causes: List[CauseSchema]
    recommendations: List[RecommendationSchema]

class PatientProfileSchema(Schema):
    id: int
    full_name: str
    birth_date: Optional[datetime.date] = None
    gender: Optional[str] = None

class CreateProfileSchema(Schema):
    full_name: str
    birth_date: Optional[datetime.date] = None
    gender: Optional[str] = None 

class AssignProfileRequest(Schema):
    profile_id: int

class ClaimRequestSchema(Schema):
    analysis_uid: uuid.UUID
    email: str
    phone: str = None

class AuthResponseSchema(Schema):
    token: str 
    user_email: str

class AnalysisResponseSchema(Schema):
    uid: uuid.UUID
    status: str
    ai_result: Optional[AIResultSchema] = None
    patient_profile_id: Optional[int] = None

class IndicatorHistoryPoint(Schema):
    date: datetime.date
    value: float
    unit: Optional[str] = None
    analysis_uid: uuid.UUID  # Чтобы по клику на точку открыть сам анализ

class ChartResponseSchema(Schema):
    slug: str
    name: str
    data: List[IndicatorHistoryPoint]