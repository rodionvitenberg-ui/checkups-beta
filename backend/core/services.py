from django.db import transaction
from .models import MedicalAnalysis, AnalysisIndicator
import datetime

def save_atomic_indicators(analysis: MedicalAnalysis, ai_result: dict):
    """
    Парсит JSON-результат и сохраняет показатели в таблицу AnalysisIndicator
    для будущих графиков.
    """
    # Если анализ не привязан к пациенту, мы не можем строить историю.
    # (Хотя технически можем привязать позже, но пока так).
    if not analysis.patient:
        print(f"⚠️ Skipping atomic save for {analysis.uid}: No patient linked.")
        return

    indicators_data = ai_result.get('indicators', [])
    
    # Дата анализа: Пытаемся взять из OCR, иначе берем дату загрузки файла
    analysis_date = analysis.created_at.date()
    
    # Пытаемся найти дату в patient_info, если AI её нашел
    # (Тут можно доработать логику парсинга даты из строки)
    
    new_records = []
    
    for item in indicators_data:
        slug = item.get('slug')
        
        # Сохраняем ТОЛЬКО те, что удалось опознать (есть slug)
        if not slug:
            continue
            
        raw_value = item.get('value', '')
        num_value = None
        
        # Пытаемся превратить строку "12,5" или "12.5" в float
        try:
            # Убираем пробелы, заменяем запятую на точку
            clean_val = raw_value.replace(',', '.').replace(' ', '')
            # Удаляем всё кроме цифр и точки (на случай "12.5*")
            import re
            clean_val = re.sub(r'[^\d.]', '', clean_val)
            num_value = float(clean_val)
        except ValueError:
            pass # Не число (например "negative"), ну и ладно

        record = AnalysisIndicator(
            analysis=analysis,
            patient=analysis.patient,
            slug=slug,
            name=item.get('name', 'Unknown'),
            value=num_value,
            string_value=raw_value[:50], # Обрезаем если слишком длинно
            unit=item.get('unit'),
            date=analysis_date
        )
        new_records.append(record)

    # Массовая вставка (быстрее, чем loop save)
    if new_records:
        with transaction.atomic():
            # Очищаем старые записи этого анализа (на случай перезапуска пайплайна)
            AnalysisIndicator.objects.filter(analysis=analysis).delete()
            AnalysisIndicator.objects.bulk_create(new_records)
        print(f"✅ Saved {len(new_records)} atomic indicators for graph.")