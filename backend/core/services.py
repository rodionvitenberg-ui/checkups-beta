from django.db import transaction
from .models import MedicalAnalysis, AnalysisIndicator, PatientProfile
import datetime
import re

def save_atomic_indicators(analysis: MedicalAnalysis, ai_result: dict):
    """
    Парсит JSON-результат и сохраняет показатели в таблицу AnalysisIndicator.
    """
    if not analysis.patient:
        print(f"⚠️ Пропуск сохранения показателей для {analysis.uid}: Нет пациента.")
        return

    indicators_data = ai_result.get('indicators', [])
    
    analysis_date = analysis.created_at.date() if analysis.created_at else datetime.date.today()
    extracted_date_str = ai_result.get('patient_info', {}).get('extracted_date')
    
    if extracted_date_str:
        try:
            analysis_date = datetime.datetime.strptime(extracted_date_str, "%Y-%m-%d").date()
        except ValueError:
            pass
    
    new_records = []
    
    for item in indicators_data:
        slug = item.get('slug')
        if not slug:
            continue
            
        raw_value = item.get('value', '')
        num_value = None
        
        try:
            clean_val = str(raw_value).replace(',', '.').replace(' ', '')
            clean_val = re.sub(r'[^\d.]', '', clean_val)
            if clean_val:
                num_value = float(clean_val)
        except ValueError:
            pass 

        record = AnalysisIndicator(
            analysis=analysis,
            patient=analysis.patient, # Пациент уже привязан в tasks.py
            slug=slug,
            name=item.get('name', 'Unknown'),
            value=num_value,
            string_value=str(raw_value)[:50],
            unit=item.get('unit'),
            date=analysis_date
        )
        new_records.append(record)

    if new_records:
        with transaction.atomic():
            AnalysisIndicator.objects.filter(analysis=analysis).delete()
            AnalysisIndicator.objects.bulk_create(new_records)
        print(f"✅ Сохранено {len(new_records)} показателей для профиля: {analysis.patient.full_name}")