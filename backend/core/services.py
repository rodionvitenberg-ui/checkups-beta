from django.db import transaction
from .models import MedicalAnalysis, AnalysisIndicator, PatientProfile
import re
from datetime import datetime
import datetime as dt

def save_atomic_indicators(analysis: MedicalAnalysis, ai_result: dict):
    """
    Парсит JSON-результат и сохраняет показатели в таблицу AnalysisIndicator.
    """
    if not analysis.patient:
        print(f"⚠️ Пропуск сохранения показателей для {analysis.uid}: Нет пациента.")
        return

    indicators_data = ai_result.get('indicators', [])
    
    analysis_date = analysis.created_at.date() if analysis.created_at else dt.date.today()
    
    # 1. Сначала ищем там, где она должна быть (в patient_info)
    extracted_date_str = None
    patient_info = ai_result.get('patient_info', {})
    if isinstance(patient_info, dict):
        extracted_date_str = patient_info.get('extracted_date')

    # 2. АГРЕССИВНЫЙ ПОИСК (Если ИИ потерял поле или вернул null)
    if not extracted_date_str:
        import json
        json_dump = json.dumps(ai_result)
        # Расширенный поиск: ловит YYYY-MM-DD или DD.MM.YYYY или DD/MM/YYYY или DD-MM-YYYY
        fallback_match = re.search(r'(\d{4}-\d{2}-\d{2})|(\d{2}[\./-]\d{2}[\./-]\d{4})', json_dump)
        if fallback_match:
            extracted_date_str = fallback_match.group(0)
            print(f"⚠️ Дата вытащена агрессивным поиском: {extracted_date_str}")
    
    # 3. Парсинг найденной строки
    if extracted_date_str and isinstance(extracted_date_str, str):
        print(f"🔍 Пытаемся распарсить дату от ИИ: {extracted_date_str}")
        try:
            match_iso = re.search(r'(\d{4})-(\d{2})-(\d{2})', extracted_date_str)
            # Добавили дефис в разрешенные разделители для RU формата
            match_ru = re.search(r'(\d{2})[\./-](\d{2})[\./-](\d{4})', extracted_date_str)
            
            if match_iso:
                analysis_date = datetime.strptime(match_iso.group(0), "%Y-%m-%d").date()
                print(f"✅ Успешно установлена ISO дата: {analysis_date}")
            elif match_ru:
                # Группы: 1-день, 2-месяц, 3-год
                analysis_date = datetime.strptime(f"{match_ru.group(3)}-{match_ru.group(2)}-{match_ru.group(1)}", "%Y-%m-%d").date()
                print(f"✅ Успешно установлена локальная дата: {analysis_date}")
        except Exception as e:
            print(f"⚠️ Ошибка парсинга даты '{extracted_date_str}': {e}. Используем дату по умолчанию.")
    else:
        print("⚠️ ИИ не вернул дату, используем дату загрузки.")

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
            patient=analysis.patient,
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
            # Удаляем старые показатели этого анализа (если это ре-анализ)
            AnalysisIndicator.objects.filter(analysis=analysis).delete()
            AnalysisIndicator.objects.bulk_create(new_records)
        print(f"✅ Сохранено {len(new_records)} показателей для профиля: {analysis.patient.full_name} (Дата: {analysis_date})")