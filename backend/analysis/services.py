import os
import json
import time
from google import genai
from google.genai import types
from pathlib import Path

from core.schemas import AIResultSchema
from analysis.models import PromptTemplate

class AnalysisPipeline:
    def __init__(self, language_code='ru'):
        self.api_keys = []
        for key, val in os.environ.items():
            if key.startswith("GOOGLE_API_KEY") and val:
                self.api_keys.append(val)
        
        if not self.api_keys:
            self.api_keys = ["DUMMY_KEY"]
            
        self.current_key_idx = 0
        self.model_name = "gemini-2.5-flash"
        self.language_code = language_code

    def _get_client(self):
        """Создает клиента с ТЕКУЩИМ активным ключом"""
        return genai.Client(api_key=self.api_keys[self.current_key_idx])

    def _switch_key(self):
        """Переключается на следующий ключ, если текущий иссяк"""
        if self.current_key_idx < len(self.api_keys) - 1:
            self.current_key_idx += 1
            print(f"🔄 ЛИМИТЫ ИСЧЕРПАНЫ. Переключаюсь на резервный API KEY #{self.current_key_idx + 1}")
            return True
        return False

    def _call_gemini_with_fallback(self, prompt, schema=None, mime_type="application/json", image_parts=None, max_retries=None):
        """Обертка для вызова ИИ с автоматическим переключением ключей при 429 ошибке"""
        
        # Если количество попыток не задано жестко, даем по 2 попытки на каждый ключ
        if max_retries is None:
            max_retries = len(self.api_keys) * 2

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
                
                # ИСПРАВЛЕНИЕ: Превращаем Pydantic-объект в обычный словарь (dict)
                if schema and response.parsed:
                    if hasattr(response.parsed, 'model_dump'):
                        return response.parsed.model_dump()
                    elif hasattr(response.parsed, 'dict'):
                        return response.parsed.dict()
                    return response.parsed

                return response.text

            except Exception as e:
                err_str = str(e).lower()
                print(f"⚠️ Gemini API Error (Попытка {attempt + 1}/{max_retries}): {e}")
                
                # Если уперлись в лимиты (429 Resource Exhausted)
                if "429" in err_str or "exhausted" in err_str or "quota" in err_str:
                    if self._switch_key():
                        continue # Сразу пробуем новый ключ
                    else:
                        print("❌ Все резервные ключи исчерпаны! Ждем 5 сек...")
                        time.sleep(5) # Ждем, вдруг лимиты сбросятся
                else:
                    time.sleep(2) # При 500-х ошибках сервера просто ждем 2 сек

        raise Exception("Failed to call Gemini after multiple retries and key switches")

    def _get_prompt(self, role: str) -> str:
        """Достает системный промпт из БД"""
        try:
            # Берем активный шаблон для нужной роли
            template = PromptTemplate.objects.get(role=role, is_active=True)
            
            # Благодаря django-modeltranslation, если локаль активирована,
            # template.system_prompt автоматически отдаст текст на нужном языке (en, es, ru)
            prompt_text = template.system_prompt
            
            # Добавляем справочники/примеры, если они есть
            if template.context_data:
                prompt_text += f"\n\n{template.context_data}"
                
            return prompt_text
            
        except PromptTemplate.DoesNotExist:
            raise ValueError(f"❌ Активный промпт для роли '{role}' не найден в БД!")

    def run_pipeline(self, safe_text: str, patient_context: str = None) -> dict:
        try:
            print(f"--- Stage 1: Extraction ({self.model_name}, Lang: {self.language_code}) ---")
            raw_data = self._step_extract(safe_text)
            
            print(f"--- Stage 2: Interpretation ({self.model_name}) ---")
            interpreted_data = self._step_interpret(raw_data, patient_context)
            
            print(f"--- Stage 3: Verification ({self.model_name}) ---")
            final_data = self._step_verify(raw_data, interpreted_data)
            
            return final_data.model_dump() if hasattr(final_data, 'model_dump') else final_data
        except Exception as e:
            print(f"Pipeline failed: {e}")
            return None

    def _step_extract(self, safe_text: str):
        # ДИНАМИЧЕСКИЙ ПРОМПТ
        sys_prompt = self._get_prompt('extractor')
        full_prompt = f"{sys_prompt}\n\nОБЕЗЛИЧЕННЫЙ ТЕКСТ АНАЛИЗА:\n{safe_text}"
        
        result = self._call_gemini_with_fallback(prompt=full_prompt, mime_type="application/json")
        return json.loads(result) if isinstance(result, str) else result

    def _step_interpret(self, raw_data: dict, patient_context: str = None):
        # ДИНАМИЧЕСКИЙ ПРОМПТ
        sys_prompt = self._get_prompt('interpreter')
        context_str = f"КОНТЕКСТ ПАЦИЕНТА: {patient_context}" if patient_context else "КОНТЕКСТ ПАЦИЕНТА: Неизвестен (анализируй по общим нормам)."
        
        full_prompt = f"{sys_prompt}\n{context_str}\nВОТ ИСХОДНЫЕ ДАННЫЕ (RAW JSON):\n{json.dumps(raw_data, ensure_ascii=False)}"
        return self._call_gemini_with_fallback(prompt=full_prompt, schema=AIResultSchema)

    def _step_verify(self, raw_data: dict, interpreted_data):
        # ДИНАМИЧЕСКИЙ ПРОМПТ
        sys_prompt = self._get_prompt('verifier')
        interpreted_json = interpreted_data.model_dump_json() if hasattr(interpreted_data, 'model_dump_json') else json.dumps(interpreted_data, ensure_ascii=False)
        
        full_prompt = f"{sys_prompt}\nИСХОДНЫЕ ДАННЫЕ:\n{json.dumps(raw_data, ensure_ascii=False)}\nЗАКЛЮЧЕНИЕ ИНТЕРПРЕТАТОРА:\n{interpreted_json}"
        return self._call_gemini_with_fallback(prompt=full_prompt, schema=AIResultSchema)