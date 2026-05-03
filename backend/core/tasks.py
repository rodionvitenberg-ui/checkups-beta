import fitz # PyMuPDF
from celery import shared_task
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from django.utils import timezone
from datetime import timedelta
from .models import MedicalAnalysis, AnalysisIndicator, PatientProfile
from analysis.services import AnalysisPipeline 
from core.services import save_atomic_indicators
from django.utils import translation

analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()

def extract_text_from_pdf(file_path):
    doc = fitz.open(file_path)
    text = "\n".join([page.get_text("text") for page in doc])
    return text

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


@shared_task(bind=True, max_retries=5)
def process_analysis_task(self, analysis_id, language_code='en'): 
    # Временно переключаем локаль воркера, чтобы django-modeltranslation 
    # подтянул правильные поля из БД
    translation.activate(language_code)
    print(f"🔄 Pipeline started for Analysis ID: {analysis_id} (Lang: {language_code})")
    
    try:
        analysis = MedicalAnalysis.objects.select_related('patient', 'user').get(uid=analysis_id)
        
        if analysis.status != MedicalAnalysis.Status.PROCESSING:
            analysis.status = MedicalAnalysis.Status.PROCESSING
            analysis.save(update_fields=['status'])
        
        # --- ШАГ 1: Извлекаем сырой текст ---
        raw_text = extract_text_from_pdf(analysis.file.path)
        
        # --- ШАГ 2: Ищем имя (NER) и привязываем профиль ---
        # Подключаем русский, английский и испанский для максимально точного поиска
        results_ru = analyzer.analyze(text=raw_text, entities=["PERSON"], language='ru')
        results_en = analyzer.analyze(text=raw_text, entities=["PERSON"], language='en')
        results_es = analyzer.analyze(text=raw_text, entities=["PERSON"], language='es')
        
        # Склеиваем все результаты
        all_results = results_ru + results_en + results_es
        
        extracted_name = None
        if all_results:
            # Берем сущность PERSON с наибольшим весом (score) среди всех языков
            best_match = max(all_results, key=lambda x: x.score)
            extracted_name = raw_text[best_match.start:best_match.end].strip()

        if extracted_name and analysis.user:
            profile, created = PatientProfile.objects.get_or_create(
                user=analysis.user, full_name=extracted_name
            )
            analysis.patient = profile
            analysis.save(update_fields=['patient'])
        elif not analysis.patient and analysis.user:
            # Дефолтный профиль
            profile, _ = PatientProfile.objects.get_or_create(
                user=analysis.user, full_name="Я (Основной профиль)"
            )
            analysis.patient = profile
            analysis.save(update_fields=['patient'])

        # --- ШАГ 3: АНОНИМИЗАЦИЯ ---
        # Ищем все PII (имена, телефоны, адреса, даты)
        pii_ru = analyzer.analyze(text=raw_text, language='ru')
        pii_en = analyzer.analyze(text=raw_text, language='en')
        pii_es = analyzer.analyze(text=raw_text, language='es')
        
        anonymized_result = anonymizer.anonymize(
            text=raw_text, 
            analyzer_results=pii_ru + pii_en + pii_es
        )
        safe_text = anonymized_result.text
        
        # --- ШАГ 4: Сборка контекста прогрессии ---
        patient_context = ""
        if analysis.patient:
            age_str = f", Дата рождения: {analysis.patient.birth_date}" if analysis.patient.birth_date else ""
            gender_str = f"Пол: {analysis.patient.get_gender_display()}" if analysis.patient.gender else "Пол: Не указан"
            patient_context = f"{gender_str}{age_str}"
            
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

        # --- ШАГ 5: Запуск пайплайна (передаем ТЕКСТ) ---
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
            
            # ДАЖЕ ЕСЛИ ОШИБКА, ЗАПУСКАЕМ СЛЕДУЮЩИЙ
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
                analysis.refresh_from_db()
                analysis.status = MedicalAnalysis.Status.FAILED
                analysis.save(update_fields=['status'])
                
                # ВСЕ ПОПЫТКИ ИСЧЕРПАНЫ - ИДЕМ ДАЛЬШЕ
                trigger_next_analysis(analysis, language_code)
            except Exception:
                pass
            return False
            
    finally:
        # КРИТИЧЕСКИ ВАЖНО: Очищаем локаль за собой, чтобы не ломать следующие таски в этом воркере
        translation.deactivate()