from celery import shared_task
from .models import MedicalAnalysis, AnalysisIndicator, PatientProfile
from analysis.services import AnalysisPipeline 
from core.services import save_atomic_indicators
from django.utils import timezone
from datetime import timedelta
import time

@shared_task(bind=True, max_retries=5)
def process_analysis_task(self, analysis_id):
    print(f"🔄 Pipeline started for Analysis ID: {analysis_id}")
    
    try:
        analysis = MedicalAnalysis.objects.select_related('patient', 'user').get(uid=analysis_id)
        
        if analysis.status != MedicalAnalysis.Status.PROCESSING:
            analysis.status = MedicalAnalysis.Status.PROCESSING
            analysis.save(update_fields=['status'])
        
        # 1. ФОРМИРОВАНИЕ БАЗОВОГО КОНТЕКСТА (Пол, Возраст)
        patient_context = ""
        if analysis.patient:
            age_str = f", Дата рождения: {analysis.patient.birth_date}" if analysis.patient.birth_date else ""
            gender_str = f"Пол: {analysis.patient.get_gender_display()}" if analysis.patient.gender else "Пол: Не указан"
            patient_context = f"{gender_str}{age_str}"
            
            # 2. ФОРМИРОВАНИЕ ИСТОРИЧЕСКОГО КОНТЕКСТА (Динамика)
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
                    history_str = "\n\nИСТОРИЯ ПРЕДЫДУЩИХ АНАЛИЗОВ ПАЦИЕНТА (ДЛЯ ОЦЕНКИ ДИНАМИКИ):\n"
                    for name, val in hist_dict.items():
                        history_str += f"- {name}: {val}\n"
                    
                    patient_context += history_str
                    print(f"📈 Добавлена история для динамики: {len(hist_dict)} показателей")

        print(f"ℹ️ Using Patient Context: {patient_context}")

        pipeline = AnalysisPipeline()
        result = pipeline.run_pipeline(analysis.file.path, patient_context)
        
        if result:
            analysis.refresh_from_db()
            analysis.ai_result = result
            analysis.status = MedicalAnalysis.Status.COMPLETED
            
            # --- УМНОЕ РАСПРЕДЕЛЕНИЕ ПО ПРОФИЛЯМ ПОСЛЕ ИИ ---
            # Если анализ загрузил авторизованный юзер, проверяем имя
            if analysis.user:
                ext_name = None
                if isinstance(result, dict) and 'patient_info' in result and result['patient_info']:
                    ext_name = result['patient_info'].get('extracted_name')
                elif hasattr(result, 'patient_info') and result.patient_info:
                    ext_name = getattr(result.patient_info, 'extracted_name', None)
                
                # Если ИИ нашел имя, и это не слово "null"
                if ext_name and str(ext_name).strip() and str(ext_name).lower() != 'null':
                    name_str = str(ext_name).strip()
                    # Ищем профиль с таким именем у этого юзера
                    profile = PatientProfile.objects.filter(user=analysis.user, full_name__iexact=name_str).first()
                    if not profile:
                        # Создаем новый профиль, если такого еще нет
                        profile = PatientProfile.objects.create(user=analysis.user, full_name=name_str)
                    analysis.patient = profile
                    
            # Сохраняем обновленные данные и (возможно) новый профиль
            analysis.save(update_fields=['ai_result', 'status', 'patient'])
            
            try:
                save_atomic_indicators(analysis, result)
            except Exception as db_err:
                print(f"⚠️ Error saving atomic indicators: {db_err}")
            
            print(f"✅ Pipeline finished for {analysis_id}")
            return True
        else:
            analysis.refresh_from_db()
            analysis.status = MedicalAnalysis.Status.FAILED
            analysis.save(update_fields=['status'])
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
            except Exception:
                pass
            return False