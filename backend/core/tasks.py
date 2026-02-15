from celery import shared_task
from .models import MedicalAnalysis
# Импортируем новый пайплайн из нового приложения
from analysis.services import AnalysisPipeline 

@shared_task
def process_analysis_task(analysis_id):
    print(f"🔄 Pipeline started for Analysis ID: {analysis_id}")
    
    try:
        analysis = MedicalAnalysis.objects.get(id=analysis_id)
        analysis.status = MedicalAnalysis.Status.PROCESSING
        analysis.save()
        
        # Запускаем цепочку
        pipeline = AnalysisPipeline()
        result = pipeline.run_pipeline(analysis.file.path)
        
        if result:
            analysis.ai_result = result
            analysis.status = MedicalAnalysis.Status.COMPLETED
        else:
            analysis.status = MedicalAnalysis.Status.FAILED
            
        analysis.save()
        print(f"✅ Pipeline finished for {analysis_id}")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        # ... обработка ошибок (как была) ...
        return False