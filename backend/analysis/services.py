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
        
        # Конфигурация моделей
        self.flash_model = "gemini-2.5-flash"
        self.pro_model = "gemini-3.0-pro-001" # Или актуальная версия 3.0 Pro

    def _get_image_content(self, file_path: str):
        """Подготовка изображения (как и раньше)"""
        path_obj = Path(file_path)
        parts = []
        if path_obj.suffix.lower() == '.pdf':
            images = convert_from_path(file_path, dpi=200)
            parts.extend(images)
        else:
            parts.append(PIL.Image.open(file_path))
        return parts

    def run_pipeline(self, file_path: str) -> dict:
        """
        Главный метод, запускающий цепочку:
        Extract -> Interpret -> Verify
        """
        try:
            print("--- Stage 1: Extraction (Flash) ---")
            raw_data = self._step_extract(file_path)
            if not raw_data: raise ValueError("Extraction failed")

            print("--- Stage 2: Interpretation (Pro) ---")
            interpreted_data = self._step_interpret(raw_data)
            if not interpreted_data: raise ValueError("Interpretation failed")

            print("--- Stage 3: Verification (Pro) ---")
            verified_data = self._step_verify(raw_data, interpreted_data)
            
            # Финальная валидация схемы перед отдачей
            return AIResultSchema(**verified_data).dict()

        except Exception as e:
            print(f"Pipeline Error: {e}")
            return None

    def _step_extract(self, file_path):
        """Шаг 1: Видим цифры"""
        content = self._get_image_content(file_path)
        content.insert(0, EXTRACTOR_SYSTEM_PROMPT)
        
        response = self.client.models.generate_content(
            model=self.flash_model,
            contents=content,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        return json.loads(response.text)

    def _step_interpret(self, raw_data: dict):
        """Шаг 2: Думаем как врач"""
        prompt = f"""
        {INTERPRETER_SYSTEM_PROMPT}
        
        ВОТ ИСХОДНЫЕ ДАННЫЕ (RAW JSON):
        {json.dumps(raw_data, ensure_ascii=False)}
        """
        
        response = self.client.models.generate_content(
            model=self.pro_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.4 # Чуть больше свободы для объяснений
            )
        )
        return json.loads(response.text)

    def _step_verify(self, raw_data: dict, interpreted_data: dict):
        """Шаг 3: Проверяем ошибки"""
        prompt = f"""
        {VERIFIER_SYSTEM_PROMPT}
        
        ИСХОДНЫЕ ДАННЫЕ:
        {json.dumps(raw_data, ensure_ascii=False)}
        
        ЗАКЛЮЧЕНИЕ ИНТЕРПРЕТАТОРА:
        {json.dumps(interpreted_data, ensure_ascii=False)}
        """
        
        response = self.client.models.generate_content(
            model=self.pro_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1 # Максимальная строгость
            )
        )
        return json.loads(response.text)