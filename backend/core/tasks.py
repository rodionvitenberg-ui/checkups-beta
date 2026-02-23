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
        analysis = MedicalAnalysis.objects.select_related('patient').get(uid=analysis_id)
        
        # Если это не первая попытка (например, ретрай), не сбрасываем статус, 
        # но можем обновить время обновления
        if analysis.status != MedicalAnalysis.Status.PROCESSING:
            analysis.status = MedicalAnalysis.Status.PROCESSING
            analysis.save(update_fields=['status'])
        
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
            # 🛑 РЕШЕНИЕ ГОНКИ СОСТОЯНИЙ:
            # Обновляем объект из БД, чтобы не затереть юзера, который мог 
            # привязать анализ через функцию claim_analysis, пока ИИ думал.
            analysis.refresh_from_db()
            
            analysis.ai_result = result
            analysis.status = MedicalAnalysis.Status.COMPLETED
            # Сохраняем ТОЛЬКО эти два поля
            analysis.save(update_fields=['ai_result', 'status'])
            
            try:
                save_atomic_indicators(analysis, result)
            except Exception as db_err:
                print(f"⚠️ Error saving atomic indicators: {db_err}")
            
            print(f"✅ Pipeline finished for {analysis_id}")
            return True
        else:
            # Внутренняя ошибка пайплайна
            analysis.refresh_from_db()
            analysis.status = MedicalAnalysis.Status.FAILED
            analysis.save(update_fields=['status'])
            return False

    except Exception as exc:
        print(f"❌ Error in Task: {exc}")
        
        # Логика повтора (Retry)
        countdown = 5 * (2 ** self.request.retries)
        
        try:
            print(f"⚠️ Retrying in {countdown}s... (Attempt {self.request.retries + 1}/5)")
            raise self.retry(exc=exc, countdown=countdown)
        except self.MaxRetriesExceededError:
            print("❌ Max retries exceeded.")
            # Только когда попытки кончились, ставим статус FAILED
            try:
                analysis.refresh_from_db()
                analysis.status = MedicalAnalysis.Status.FAILED
                analysis.save(update_fields=['status'])
            except Exception:
                pass
            return False