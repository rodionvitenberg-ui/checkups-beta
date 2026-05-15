import os
import fitz # PyMuPDF
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
from celery import shared_task
from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine
from django.utils import timezone
from datetime import timedelta
from .models import MedicalAnalysis, AnalysisIndicator, PatientProfile
from analysis.services import AnalysisPipeline 
from core.services import save_atomic_indicators
from django.utils import translation

# --- НАСТРОЙКА PRESIDIO ДЛЯ МУЛЬТИЯЗЫЧНОСТИ ---
nlp_configuration = {
    "nlp_engine_name": "spacy",
    "models": [
        {"lang_code": "en", "model_name": "en_core_web_sm"},
        {"lang_code": "ru", "model_name": "ru_core_news_sm"},
        {"lang_code": "es", "model_name": "es_core_news_md"},
    ]
}
nlp_engine = NlpEngineProvider(nlp_configuration=nlp_configuration).create_engine()

analyzer = AnalyzerEngine(
    nlp_engine=nlp_engine, 
    supported_languages=["en", "ru", "es"]
)
anonymizer = AnonymizerEngine()
# ----------------------------------------------

def trigger_next_analysis(analysis, language_code='en'):
    """
    Ищет следующий анализ в очереди для этого пользователя и запускает его.
    Это создает последовательную цепную реакцию (один за другим).
    """
    if analysis.user:
        next_pending = MedicalAnalysis.objects.filter(
            user=analysis.user, 
            status=MedicalAnalysis.Status.PENDING
        ).exclude(uid=analysis.uid).order_by('created_at').first()
        
        if next_pending:
            print(f"🔗 Цепная реакция: Запускаем следующий анализ ({next_pending.uid}) на языке {language_code}")
            # Обязательно прокидываем язык дальше!
            process_analysis_task.delay(next_pending.uid, language_code)

def extract_text_from_document(file_path):
    """
    Универсальный экстрактор текста.
    Читает векторные PDF напрямую. Сканы PDF и картинки читает через OCR.
    """
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    
    # --- ОБРАБОТКА PDF ---
    if ext == '.pdf':
        try:
            # 1. Пытаемся вытащить текст стандартно (векторный PDF)
            doc = fitz.open(file_path)
            text = "\n".join([page.get_text("text") for page in doc])
            doc.close()
            
            # 2. Если текста почти нет (это скан или фото внутри PDF) -> включаем OCR
            if len(text.strip()) < 100:
                print("📄 PDF выглядит как скан. Запускаю OCR-движок...")
                images = convert_from_path(file_path)
                text = ""
                for img in images:
                    # lang='rus+eng' критически важно для мед. терминов на латыни
                    text += pytesseract.image_to_string(img, lang='rus+eng') + "\n"
        except Exception as e:
            print(f"❌ Ошибка чтения PDF: {e}")
            
    # --- ОБРАБОТКА ИЗОБРАЖЕНИЙ (JPG, PNG) ---
    elif ext in ['.jpg', '.jpeg', '.png']:
        print("🖼️ Распознаю изображение через OCR...")
        try:
            img = Image.open(file_path)
            text = pytesseract.image_to_string(img, lang='rus+eng')
        except Exception as e:
            print(f"❌ Ошибка чтения изображения: {e}")
            
    return text

@shared_task(bind=True, max_retries=5)
def process_analysis_task(self, analysis_id, language_code='en'): 
    translation.activate(language_code)
    
    try:
        analysis = MedicalAnalysis.objects.select_related('patient', 'user').get(uid=analysis_id)
    except MedicalAnalysis.DoesNotExist:
        translation.deactivate()
        return False
        
    try:
        if analysis.status != MedicalAnalysis.Status.PROCESSING:
            analysis.status = MedicalAnalysis.Status.PROCESSING
            analysis.save(update_fields=['status'])
        
        # --- ШАГ 1: Извлекаем сырой текст ---
        raw_text = extract_text_from_document(analysis.file.path)

        if not raw_text.strip():
            print("❌ Не удалось извлечь текст из документа.")
            analysis.status = MedicalAnalysis.Status.FAILED
            analysis.save(update_fields=['status'])
            return False
        
       # --- ШАГ 2: АНОНИМИЗАЦИЯ ---
        # Явно указываем Presidio, ЧТО именно вырезать. 
        # Мы НЕ включаем сюда 'DATE_TIME', чтобы даты дошли до нейросети!
        MASKING_ENTITIES = ["PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "LOCATION", "CREDIT_CARD", "CRYPTO"]
        
        pii_ru = analyzer.analyze(text=raw_text, language='ru', entities=MASKING_ENTITIES)
        pii_en = analyzer.analyze(text=raw_text, language='en', entities=MASKING_ENTITIES)
        pii_es = analyzer.analyze(text=raw_text, language='es', entities=MASKING_ENTITIES)
        
        anonymized_result = anonymizer.anonymize(
            text=raw_text, 
            analyzer_results=pii_ru + pii_en + pii_es
        )
        safe_text = anonymized_result.text
        
        # --- ШАГ 3: Сборка контекста прогрессии и профиля ---
        patient_context = ""
        if analysis.patient:
            context_lines = []
            
            # 3.1. Базовые демографические параметры
            if analysis.patient.gender:
                context_lines.append(f"Пол: {analysis.patient.get_gender_display()}")
            else:
                context_lines.append("Пол: Не указан")
                
            if analysis.patient.birth_date:
                dob = analysis.patient.birth_date
                # Используем дату загрузки анализа как точку отсчета
                analysis_date = analysis.created_at.date()
                
                # Точная математика: сколько полных лет
                age_years = analysis_date.year - dob.year - ((analysis_date.month, analysis_date.day) < (dob.month, dob.day))
                
                if age_years > 0:
                    age_str = f"{age_years} лет/года"
                else:
                    # Если ребенку меньше года, считаем месяцы
                    age_months = (analysis_date.year - dob.year) * 12 + analysis_date.month - dob.month - int((analysis_date.day) < (dob.day))
                    age_str = f"{age_months} месяцев"
                    
                context_lines.append(f"Дата рождения: {dob} (ТОЧНЫЙ ВОЗРАСТ НА МОМЕНТ АНАЛИЗА: {age_str})")
            
            # 3.2. Физические параметры и расчет ИМТ (Новая логика)
            if analysis.patient.weight:
                context_lines.append(f"Вес: {analysis.patient.weight} кг")
            if analysis.patient.height:
                context_lines.append(f"Рост: {analysis.patient.height} см")
                
            if analysis.patient.weight and analysis.patient.height:
                height_m = analysis.patient.height / 100.0
                if height_m > 0:
                    bmi = round(analysis.patient.weight / (height_m ** 2), 1)
                    context_lines.append(f"Индекс массы тела (ИМТ): {bmi}")

            # 3.3. Премиум-характеристики (Хронические заболевания, привычки)
            # Обернуто в try-except для безопасности до применения миграций premium
            try:
                # Используем related_name 'premium_traits', который мы заложили в моделях
                premium_traits = analysis.patient.premium_traits.select_related('trait').all()
                if premium_traits.exists():
                    context_lines.append("\nДОПОЛНИТЕЛЬНЫЙ КОНТЕКСТ ПАЦИЕНТА:")
                    for link in premium_traits:
                        trait_name = link.trait.name
                        details = link.details if link.details else "Детали не указаны"
                        context_lines.append(f"- {trait_name}: {details}")
            except Exception as e:
                print(f"⚠️ Premium traits not available or not migrated yet: {e}")

            # Склеиваем демографию и профиль в единый блок
            patient_context = "\n".join(context_lines)
            
            # 3.4. История анализов
            six_months_ago = timezone.now().date() - timedelta(days=180)
            past_indicators = AnalysisIndicator.objects.filter(
                patient=analysis.patient, 
                date__gte=six_months_ago,
                value__isnull=False
            ).exclude(analysis=analysis).order_by('-date')
            
            if past_indicators.exists():
                hist_dict = {}
                for ind in past_indicators:
                    if ind.name not in hist_dict:
                        hist_dict[ind.name] = f"{ind.value} {ind.unit or ''} (от {ind.date.strftime('%d.%m.%Y')})"
                
                if hist_dict:
                    history_str = "\n\nИСТОРИЯ ПРЕДЫДУЩИХ АНАЛИЗОВ ПАЦИЕНТА:\n"
                    for name, val in hist_dict.items():
                        history_str += f"- {name}: {val}\n"
                    patient_context += history_str

        # --- ШАГ 4: Запуск пайплайна (передаем ТЕКСТ) ---
        pipeline = AnalysisPipeline(language_code=language_code)
        result = pipeline.run_pipeline(safe_text, patient_context)
        
        if result:
            analysis.refresh_from_db()
            analysis.ai_result = result
            analysis.status = MedicalAnalysis.Status.COMPLETED
            analysis.save(update_fields=['ai_result', 'status'])
            
            try:
                save_atomic_indicators(analysis, result)
            except Exception as db_err:
                print(f"⚠️ Error saving atomic indicators: {db_err}")
            
            trigger_next_analysis(analysis, language_code)
            return True
        else:
            analysis.refresh_from_db()
            analysis.status = MedicalAnalysis.Status.FAILED
            analysis.save(update_fields=['status'])
            
            trigger_next_analysis(analysis, language_code)
            return False

    except Exception as exc:
        print(f"❌ Error in Task: {exc}")
        countdown = 5 * (2 ** self.request.retries)
        try:
            print(f"⚠️ Retrying in {countdown}s... (Attempt {self.request.retries + 1}/5)")
            raise self.retry(exc=exc, countdown=countdown)
        except self.MaxRetriesExceededError:
            print("❌ Max retries exceeded.")
            try:
                # Обернуто в try/except на случай, если запись удалена
                analysis.refresh_from_db()
                analysis.status = MedicalAnalysis.Status.FAILED
                analysis.save(update_fields=['status'])
                trigger_next_analysis(analysis, language_code)
            except MedicalAnalysis.DoesNotExist:
                pass
            return False
            
    finally:
        translation.deactivate()