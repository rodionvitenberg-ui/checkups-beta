from ninja import Schema
from typing import List, Optional, Any
import uuid
from datetime import date, datetime

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
    reasoning: Optional[str] = "" 
    
    patient_info: Optional[PatientMetadataSchema] = None 
    summary: Optional[SummarySchema] = None
    indicators: List[IndicatorSchema] = []
    causes: List[CauseSchema] = []
    recommendations: List[RecommendationSchema] = []

class PatientProfileSchema(Schema):
    id: int
    full_name: str
    birth_date: Optional[date] = None
    gender: Optional[str] = None

class CreateProfileSchema(Schema):
    full_name: str
    birth_date: Optional[date] = None
    gender: Optional[str] = None 

class AssignProfileRequest(Schema):
    profile_id: int

class ClaimRequestSchema(Schema):
    analysis_uid: uuid.UUID
    email: str
    phone: Optional[str] = None

class AuthResponseSchema(Schema):
    token: str 
    user_email: str

class AnalysisResponseSchema(Schema):
    uid: uuid.UUID
    status: str
    created_at: datetime
    ai_result: Optional[AIResultSchema] = None
    patient_profile_id: Optional[int] = None

class IndicatorHistoryPoint(Schema):
    date: date  # <--- ИСПРАВЛЕНО: было datetime.date, стало просто date
    value: float
    unit: Optional[str] = None
    analysis_uid: uuid.UUID

class ChartResponseSchema(Schema):
    slug: str
    name: str
    data: List[IndicatorHistoryPoint]