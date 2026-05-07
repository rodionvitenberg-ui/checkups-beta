# backend/premium/api.py

from ninja import Router
from django.shortcuts import get_object_or_404
from typing import List
from ninja_jwt.authentication import JWTAuth
from django.utils.translation import gettext as _
from django.db import IntegrityError

from core.models import PatientProfile
from .models import Trait, PatientTraitLink
from .schemas import (
    TraitSchema, 
    CreateCustomTraitSchema, 
    LinkTraitSchema, 
    PatientTraitLinkSchema
)

router = Router(auth=JWTAuth())

@router.get("/traits", response=List[TraitSchema])
def list_traits(request):
    """
    Отдает список системных черт + кастомные черты текущего юзера.
    """
    # Показываем системные (is_custom=False) ИЛИ кастомные, но созданные этим юзером
    traits = Trait.objects.filter(is_custom=False) | Trait.objects.filter(created_by=request.user)
    return traits.order_by('category', 'name')

@router.post("/traits/custom", response=TraitSchema)
def create_custom_trait(request, payload: CreateCustomTraitSchema):
    """
    Создает новую кастомную черту для конкретного пользователя.
    """
    trait = Trait.objects.create(
        name=payload.name,
        category=payload.category,
        is_custom=True,
        created_by=request.user
    )
    return trait

@router.post("/patients/{patient_id}/traits", response=PatientTraitLinkSchema)
def link_trait_to_patient(request, patient_id: int, payload: LinkTraitSchema):
    """
    Привязывает черту (болезнь/привычку) к профилю пациента с указанием деталей (стажа).
    """
    patient = get_object_or_404(PatientProfile, id=patient_id, user=request.user)
    trait = get_object_or_404(Trait, id=payload.trait_id)
    
    try:
        link = PatientTraitLink.objects.create(
            patient=patient,
            trait=trait,
            details=payload.details
        )
        return link
    except IntegrityError:
        # Срабатывает unique_together, если юзер пытается добавить "Курение" второй раз
        return router.create_response(
            request, 
            {"message": _("Эта характеристика уже добавлена к профилю")}, 
            status=400
        )

@router.get("/patients/{patient_id}/traits", response=List[PatientTraitLinkSchema])
def get_patient_traits(request, patient_id: int):
    """
    Получить все привязанные характеристики пациента.
    """
    patient = get_object_or_404(PatientProfile, id=patient_id, user=request.user)
    return PatientTraitLink.objects.filter(patient=patient).select_related('trait').order_by('-created_at')

@router.delete("/patients/traits/{link_id}")
def remove_trait_from_patient(request, link_id: int):
    """
    Удалить характеристику у пациента (если ошибся при вводе).
    """
    link = get_object_or_404(PatientTraitLink, id=link_id, patient__user=request.user)
    link.delete()
    return {"success": True, "message": _("Характеристика удалена")}