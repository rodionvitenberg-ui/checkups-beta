import os
import json
from google import genai
from google.genai import types
from pathlib import Path
from pdf2image import convert_from_path
import PIL.Image

from core.schemas import AIResultSchema
from .prompts import EXTRACTOR_SYSTEM_PROMPT, INTERPRETER_SYSTEM_PROMPT, VERIFIER_SYSTEM_PROMPT

class AnalysisPipeline:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        self.model_name = "gemini-2.5-flash" 

    def _get_image_content(self, file_path: str):
        path_obj = Path(file_path)
        parts = []
        if path_obj.suffix.lower() == '.pdf':
            images = convert_from_path(file_path, dpi=200)
            parts.extend(images)
        else:
            parts.append(PIL.Image.open(file_path))
        return parts

    # ОБНОВЛЕННАЯ СИГНАТУРА: принимаем контекст
    def run_pipeline(self, file_path: str, patient_context: str = None) -> dict:
        try:
            print(f"--- Stage 1: Extraction ({self.model_name}) ---")
            raw_data = self._step_extract(file_path)
            
            print(f"--- Stage 2: Interpretation ({self.model_name}) ---")
            # Передаем контекст на этап интерпретации
            interpreted_data = self._step_interpret(raw_data, patient_context)
            
            print(f"--- Stage 3: Verification ({self.model_name}) ---")
            verified_data = self._step_verify(raw_data, interpreted_data)
            
            return verified_data.model_dump()

        except Exception as e:
            print(f"Pipeline Error: {e}")
            return None

    def _step_extract(self, file_path):
        content = self._get_image_content(file_path)
        content.insert(0, EXTRACTOR_SYSTEM_PROMPT)
        
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=content,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        return json.loads(response.text)

    def _step_interpret(self, raw_data: dict, patient_context: str = None):
        # Формируем строку контекста
        context_str = f"КОНТЕКСТ ПАЦИЕНТА: {patient_context}" if patient_context else "КОНТЕКСТ ПАЦИЕНТА: Неизвестен (анализируй по общим нормам)."

        prompt = f"""
        {INTERPRETER_SYSTEM_PROMPT}
        
        {context_str}
        
        ВОТ ИСХОДНЫЕ ДАННЫЕ (RAW JSON):
        {json.dumps(raw_data, ensure_ascii=False)}
        """
        
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIResultSchema, # Chain-of-Thought поле 'reasoning' заполнится здесь
                temperature=0.4
            )
        )
        return response.parsed

    def _step_verify(self, raw_data: dict, interpreted_data):
        interpreted_json = interpreted_data.model_dump_json() if hasattr(interpreted_data, 'model_dump_json') else json.dumps(interpreted_data, ensure_ascii=False)

        prompt = f"""
        {VERIFIER_SYSTEM_PROMPT}
        
        ИСХОДНЫЕ ДАННЫЕ:
        {json.dumps(raw_data, ensure_ascii=False)}
        
        ЗАКЛЮЧЕНИЕ ИНТЕРПРЕТАТОРА:
        {interpreted_json}
        """
        
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIResultSchema,
                temperature=0.1
            )
        )
        return response.parsed