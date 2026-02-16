from celery import shared_task
from .models import MedicalAnalysis
from analysis.services import AnalysisPipeline 
from core.services import save_atomic_indicators
import time

# bind=True дает доступ к self (экземпляру задачи) для вызова retry
# autoretry_for - можно использовать, но лучше явный try/except для контроля статусов
@shared_task(bind=True, max_retries=5)
def process_analysis_task(self, analysis_id):
    print(f"🔄 Pipeline started for Analysis ID: {analysis_id}")
    
    try:
        analysis = MedicalAnalysis.objects.select_related('patient').get(id=analysis_id)
        
        # Если это не первая попытка (например, ретрай), не сбрасываем статус, 
        # но можем обновить время обновления
        if analysis.status != MedicalAnalysis.Status.PROCESSING:
            analysis.status = MedicalAnalysis.Status.PROCESSING
            analysis.save()
        
        # Формирование контекста
        patient_context = None
        if analysis.patient:
            age_str = f", Дата рождения: {analysis.patient.birth_date}" if analysis.patient.birth_date else ""
            gender_str = f"Пол: {analysis.patient.get_gender_display()}" if analysis.patient.gender else "Пол: Не указан"
            patient_context = f"{gender_str}{age_str}"
            print(f"ℹ️ Using Patient Context: {patient_context}")

        pipeline = AnalysisPipeline()
        
        # ЗАПУСК ПАЙПЛАЙНА
        # Если здесь вылетит 429 или 500, код упадет в except
        result = pipeline.run_pipeline(str(analysis.file.path), patient_context=patient_context)
        
        if result:
            analysis.ai_result = result
            analysis.status = MedicalAnalysis.Status.COMPLETED
            analysis.save()
            
            try:
                save_atomic_indicators(analysis, result)
            except Exception as db_err:
                print(f"⚠️ Error saving atomic indicators: {db_err}")
            
            print(f"✅ Pipeline finished for {analysis_id}")
            return True
        else:
            # Если pipeline вернул None (внутренняя ошибка без эксепшна), 
            # тоже можно попробовать повторить, или сразу упасть.
            # Пока считаем это фатальной ошибкой (например, файл не читается).
            analysis.status = MedicalAnalysis.Status.FAILED
            analysis.save()
            return False

    except Exception as exc:
        print(f"❌ Error in Task: {exc}")
        
        # Логика повтора (Retry)
        # countdown = задержка в секундах (экспоненциальная: 2^retry * 5)
        # 1-я попытка: 5 сек, 2-я: 10 сек, 3-я: 20 сек...
        countdown = 5 * (2 ** self.request.retries)
        
        try:
            print(f"⚠️ Retrying in {countdown}s... (Attempt {self.request.retries + 1}/5)")
            # Это выбросит исключение Retry, которое Celery перехватит
            raise self.retry(exc=exc, countdown=countdown)
        except self.MaxRetriesExceededError:
            print("❌ Max retries exceeded.")
            # Только когда попытки кончились, ставим статус FAILED
            try:
                analysis = MedicalAnalysis.objects.get(id=analysis_id)
                analysis.status = MedicalAnalysis.Status.FAILED
                analysis.save()
            except:
                pass
            return False