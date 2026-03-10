from celery import shared_task
from .models import MedicalAnalysis, AnalysisIndicator, PatientProfile
from analysis.services import AnalysisPipeline 
from core.services import save_atomic_indicators
from django.utils import timezone
from datetime import timedelta
import time

def trigger_next_analysis(analysis):
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
            print(f"🔗 Цепная реакция: Запускаем следующий анализ ({next_pending.uid})")
            process_analysis_task.delay(next_pending.uid)


@shared_task(bind=True, max_retries=5)
def process_analysis_task(self, analysis_id):
    print(f"🔄 Pipeline started for Analysis ID: {analysis_id}")
    
    try:
        analysis = MedicalAnalysis.objects.select_related('patient', 'user').get(uid=analysis_id)
        
        if analysis.status != MedicalAnalysis.Status.PROCESSING:
            analysis.status = MedicalAnalysis.Status.PROCESSING
            analysis.save(update_fields=['status'])
        
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

        pipeline = AnalysisPipeline()
        result = pipeline.run_pipeline(analysis.file.path, patient_context)
        
        if result:
            analysis.refresh_from_db()
            analysis.ai_result = result
            analysis.status = MedicalAnalysis.Status.COMPLETED
            
            if analysis.user:
                ext_name = None
                if isinstance(result, dict) and 'patient_info' in result and result['patient_info']:
                    ext_name = result['patient_info'].get('extracted_name')
                elif hasattr(result, 'patient_info') and result.patient_info:
                    ext_name = getattr(result.patient_info, 'extracted_name', None)
                
                if ext_name and str(ext_name).strip() and str(ext_name).lower() != 'null':
                    name_str = str(ext_name).strip()
                    profile = PatientProfile.objects.filter(user=analysis.user, full_name__iexact=name_str).first()
                    if not profile:
                        profile = PatientProfile.objects.create(user=analysis.user, full_name=name_str)
                    analysis.patient = profile
                    
            analysis.save(update_fields=['ai_result', 'status', 'patient'])
            
            try:
                save_atomic_indicators(analysis, result)
            except Exception as db_err:
                print(f"⚠️ Error saving atomic indicators: {db_err}")
            
            print(f"✅ Pipeline finished for {analysis_id}")
            
            # ЗАПУСКАЕМ СЛЕДУЮЩИЙ
            trigger_next_analysis(analysis)
            return True
        else:
            analysis.refresh_from_db()
            analysis.status = MedicalAnalysis.Status.FAILED
            analysis.save(update_fields=['status'])
            
            # ДАЖЕ ЕСЛИ ОШИБКА, ЗАПУСКАЕМ СЛЕДУЮЩИЙ
            trigger_next_analysis(analysis)
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
                trigger_next_analysis(analysis)
            except Exception:
                pass
            return False