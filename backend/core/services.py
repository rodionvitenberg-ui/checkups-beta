from django.db import transaction
from .models import MedicalAnalysis, AnalysisIndicator, PatientProfile
import datetime
import re

def save_atomic_indicators(analysis: MedicalAnalysis, ai_result: dict):
    """
    Парсит JSON-результат, АВТОМАТИЧЕСКИ СОЗДАЕТ ПАЦИЕНТА по имени из отчета
    и сохраняет показатели в таблицу AnalysisIndicator.
    """
    
    # === ЭТАП 1: АВТО-СОЗДАНИЕ И ПЕРЕОПРЕДЕЛЕНИЕ ПАЦИЕНТА ===
    # Мы больше не проверяем "if not analysis.patient", потому что tasks.py
    # мог уже ошибочно назначить дефолтный профиль. Мы жестко переопределяем его.
    
    if analysis.user:
        patient_info = ai_result.get('patient_info') or {}
        extracted_name = patient_info.get('extracted_name')
        
        # Если ИИ нашел реальное имя в бланке
        if extracted_name and str(extracted_name).strip():
            clean_name = str(extracted_name).strip()
            
            # Ищем профиль с таким именем у этого юзера или создаем новый
            profile, created = PatientProfile.objects.get_or_create(
                user=analysis.user,
                full_name=clean_name
            )
            
            # Жестко перезаписываем пациента в анализе
            analysis.patient = profile
            analysis.save(update_fields=['patient'])
            print(f"👤 Авто-привязка: {profile.full_name} (Новый: {created})")
            
        else:
            # Если ИИ не нашел имя (или это пустой бланк), проверяем, 
            # есть ли вообще хоть какой-то пациент. Если нет - ставим дефолтного.
            if not analysis.patient:
                main_profile = PatientProfile.objects.filter(user=analysis.user).first()
                if not main_profile:
                    main_profile = PatientProfile.objects.create(user=analysis.user, full_name="Я (Основной профиль)")
                analysis.patient = main_profile
                analysis.save(update_fields=['patient'])
                print(f"👤 Имя не найдено, привязка к дефолтному: {main_profile.full_name}")

    # Защита: если даже после всех манипуляций пациента нет (например, аноним), прерываем
    if not analysis.patient:
        print(f"⚠️ Пропуск сохранения показателей для {analysis.uid}: Нет пациента.")
        return

    # === ЭТАП 2: СОХРАНЕНИЕ ПОКАЗАТЕЛЕЙ ===
    indicators_data = ai_result.get('indicators', [])
    
    # Защита от ошибок даты
    analysis_date = analysis.created_at.date() if analysis.created_at else datetime.date.today()
    
    new_records = []
    
    for item in indicators_data:
        slug = item.get('slug')
        if not slug:
            continue
            
        raw_value = item.get('value', '')
        num_value = None
        
        try:
            # Чистим значение от мусора (например "12,5*" -> 12.5)
            clean_val = str(raw_value).replace(',', '.').replace(' ', '')
            clean_val = re.sub(r'[^\d.]', '', clean_val)
            if clean_val:
                num_value = float(clean_val)
        except ValueError:
            pass 

        record = AnalysisIndicator(
            analysis=analysis,
            patient=analysis.patient, # Используем нашего ПРАВИЛЬНОГО пациента
            slug=slug,
            name=item.get('name', 'Unknown'),
            value=num_value,
            string_value=str(raw_value)[:50],
            unit=item.get('unit'),
            date=analysis_date
        )
        new_records.append(record)

    # Массово пишем в БД
    if new_records:
        with transaction.atomic():
            AnalysisIndicator.objects.filter(analysis=analysis).delete()
            AnalysisIndicator.objects.bulk_create(new_records)
        print(f"✅ Сохранено {len(new_records)} показателей для профиля: {analysis.patient.full_name}")