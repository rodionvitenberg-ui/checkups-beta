import os
import json
import time
from google import genai
from google.genai import types
from pathlib import Path
from pdf2image import convert_from_path
import PIL.Image

from core.schemas import AIResultSchema
from .prompts import EXTRACTOR_SYSTEM_PROMPT, INTERPRETER_SYSTEM_PROMPT, VERIFIER_SYSTEM_PROMPT

class AnalysisPipeline:
    def __init__(self):
        # Собираем ВСЕ ключи из .env, которые начинаются с GOOGLE_API_KEY
        self.api_keys = []
        for key, val in os.environ.items():
            if key.startswith("GOOGLE_API_KEY") and val:
                self.api_keys.append(val)
        
        # Защита от пустого списка
        if not self.api_keys:
            self.api_keys = ["DUMMY_KEY"]
            
        self.current_key_idx = 0
        self.model_name = "gemini-2.5-flash" 

    def _get_client(self):
        """Создает клиента с ТЕКУЩИМ активным ключом и Cloudflare прокси"""
        return genai.Client(
            api_key=self.api_keys[self.current_key_idx],
            http_options={'base_url': 'https://gemini-proxy.rodionvitenberg.workers.dev/'} 
        )

    def _switch_key(self):
        """Переключается на следующий ключ, если текущий иссяк"""
        if self.current_key_idx < len(self.api_keys) - 1:
            self.current_key_idx += 1
            print(f"🔄 ЛИМИТЫ ИСЧЕРПАНЫ. Переключаюсь на резервный API KEY #{self.current_key_idx + 1}")
            return True
        return False

    def _call_gemini_with_fallback(self, prompt, schema=None, mime_type="application/json", image_parts=None, max_retries=5):
        """Обертка для вызова ИИ с автоматическим переключением ключей при 429 ошибке"""
        for attempt in range(max_retries):
            try:
                client = self._get_client()
                
                contents = []
                if image_parts: contents.extend(image_parts)
                contents.append(prompt)

                config_kwargs = {"temperature": 0.2}
                if mime_type: config_kwargs["response_mime_type"] = mime_type
                if schema: config_kwargs["response_schema"] = schema

                response = client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(**config_kwargs)
                )
                return response.parsed if schema else response.text

            except Exception as e:
                err_str = str(e).lower()
                print(f"⚠️ Gemini API Error (Попытка {attempt + 1}): {e}")
                
                # Если уперлись в лимиты (429 Resource Exhausted)
                if "429" in err_str or "exhausted" in err_str or "quota" in err_str:
                    if self._switch_key():
                        continue # Сразу пробуем новый ключ
                    else:
                        print("❌ Все резервные ключи исчерпаны!")
                        time.sleep(5) # Ждем, вдруг лимиты сбросятся
                else:
                    time.sleep(2) # При 500-х ошибках сервера просто ждем 2 сек

        raise Exception("Failed to call Gemini after multiple retries and key switches")

    def _get_image_content(self, file_path: str):
        path_obj = Path(file_path)
        parts = []
        if path_obj.suffix.lower() == '.pdf':
            images = convert_from_path(file_path, dpi=200)
            parts.extend(images)
        else:
            parts.append(PIL.Image.open(file_path))
        return parts

    def run_pipeline(self, file_path: str, patient_context: str = None) -> dict:
        try:
            print(f"--- Stage 1: Extraction ({self.model_name}) ---")
            raw_data = self._step_extract(file_path)
            
            print(f"--- Stage 2: Interpretation ({self.model_name}) ---")
            interpreted_data = self._step_interpret(raw_data, patient_context)
            
            print(f"--- Stage 3: Verification ({self.model_name}) ---")
            final_data = self._step_verify(raw_data, interpreted_data)
            
            return final_data.model_dump() if hasattr(final_data, 'model_dump') else final_data
        except Exception as e:
            print(f"Pipeline failed: {e}")
            return None

    def _step_extract(self, file_path: str):
        image_parts = self._get_image_content(file_path)
        # Для извлечения сырых данных схема не всегда нужна, ИИ хорошо отдает JSON сам по промпту, 
        # но мы используем резервный метод, если что.
        result = self._call_gemini_with_fallback(
            prompt=EXTRACTOR_SYSTEM_PROMPT, 
            image_parts=image_parts,
            mime_type="application/json"
        )
        return json.loads(result) if isinstance(result, str) else result

    def _step_interpret(self, raw_data: dict, patient_context: str = None):
        context_str = f"КОНТЕКСТ ПАЦИЕНТА: {patient_context}" if patient_context else "КОНТЕКСТ ПАЦИЕНТА: Неизвестен (анализируй по общим нормам)."
        prompt = f"{INTERPRETER_SYSTEM_PROMPT}\n{context_str}\nВОТ ИСХОДНЫЕ ДАННЫЕ (RAW JSON):\n{json.dumps(raw_data, ensure_ascii=False)}"
        
        return self._call_gemini_with_fallback(prompt=prompt, schema=AIResultSchema)

    def _step_verify(self, raw_data: dict, interpreted_data):
        interpreted_json = interpreted_data.model_dump_json() if hasattr(interpreted_data, 'model_dump_json') else json.dumps(interpreted_data, ensure_ascii=False)
        prompt = f"{VERIFIER_SYSTEM_PROMPT}\nИСХОДНЫЕ ДАННЫЕ:\n{json.dumps(raw_data, ensure_ascii=False)}\nЗАКЛЮЧЕНИЕ ИНТЕРПРЕТАТОРА:\n{interpreted_json}"
        
        return self._call_gemini_with_fallback(prompt=prompt, schema=AIResultSchema)