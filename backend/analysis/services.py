import os
import json
import time
from google import genai
from google.genai import types

from core.schemas import AIResultSchema
from .models import PromptTemplate

class AnalysisPipeline:
    def __init__(self, language_code='ru'):
        self.api_keys = []
        for key, val in os.environ.items():
            if key.startswith("GOOGLE_API_KEY") and val:
                self.api_keys.append(val)
        
        if not self.api_keys:
            self.api_keys = ["DUMMY_KEY"]
            
        self.current_key_idx = 0
        self.model_name = "gemini-3.1-flash" # Обновленная, умная модель!
        self.language_code = language_code 

    def _get_client(self):
        return genai.Client(api_key=self.api_keys[self.current_key_idx])

    def _switch_key(self):
        if self.current_key_idx < len(self.api_keys) - 1:
            self.current_key_idx += 1
            print(f"🔄 ЛИМИТЫ ИСЧЕРПАНЫ. Переключаюсь на резервный API KEY #{self.current_key_idx + 1}")
            return True
        return False

    def _call_gemini_with_fallback(self, prompt, schema=None, mime_type="application/json", max_retries=None, temperature=0.2):
        if max_retries is None:
            max_retries = len(self.api_keys) * 2

        for attempt in range(max_retries):
            try:
                client = self._get_client()
                
                contents = [prompt] 

                # Температуру теперь можно настраивать для каждого шага
                config_kwargs = {"temperature": temperature}
                if mime_type: config_kwargs["response_mime_type"] = mime_type
                if schema: config_kwargs["response_schema"] = schema

                response = client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(**config_kwargs)
                )
                
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
                
                if "429" in err_str or "exhausted" in err_str or "quota" in err_str:
                    if self._switch_key():
                        continue 
                    else:
                        print("❌ Все резервные ключи исчерпаны! Ждем 5 сек...")
                        time.sleep(5) 
                else:
                    time.sleep(2)

        raise Exception("Failed to call Gemini after multiple retries and key switches")

    def _get_prompt(self, role: str) -> str:
        """Достает системный промпт из БД с учетом активного языка"""
        try:
            template = PromptTemplate.objects.get(role=role, is_active=True)
            prompt_text = template.system_prompt
            if template.context_data:
                prompt_text += f"\n\n{template.context_data}"
            return prompt_text
        except PromptTemplate.DoesNotExist:
            raise ValueError(f"❌ Активный промпт для роли '{role}' не найден в БД!")

    def run_pipeline(self, safe_text: str, patient_context: str = None) -> dict:
        try:
            print(f"--- Stage 1: Секретарь (Extraction) [{self.model_name}, Lang: {self.language_code}] ---")
            raw_data = self._step_extract(safe_text)
            
            print(f"--- Stage 2: Профессор (Interpretation) [{self.model_name}] ---")
            interpreted_data = self._step_interpret(raw_data, patient_context)
            
            # ВЕРИФИКАТОР УДАЛЕН! Сразу отдаем результат
            return interpreted_data.model_dump() if hasattr(interpreted_data, 'model_dump') else interpreted_data
            
        except Exception as e:
            print(f"Pipeline failed: {e}")
            return None

    def _step_extract(self, safe_text: str):
        sys_prompt = self._get_prompt(PromptTemplate.Role.EXTRACTOR)
        full_prompt = f"{sys_prompt}\n\nОБЕЗЛИЧЕННЫЙ ТЕКСТ АНАЛИЗА:\n{safe_text}"
        
        # Для экстракции ставим температуру 0.1, чтобы ИИ не фантазировал
        result = self._call_gemini_with_fallback(
            prompt=full_prompt, 
            mime_type="application/json",
            temperature=0.1 
        )
        return json.loads(result) if isinstance(result, str) else result

    def _step_interpret(self, raw_data: dict, patient_context: str = None):
        sys_prompt = self._get_prompt(PromptTemplate.Role.INTERPRETER)
        context_str = f"КОНТЕКСТ ПАЦИЕНТА: {patient_context}" if patient_context else "КОНТЕКСТ ПАЦИЕНТА: Неизвестен."
        
        full_prompt = f"{sys_prompt}\n{context_str}\nВОТ ИСХОДНЫЕ ДАННЫЕ (RAW JSON):\n{json.dumps(raw_data, ensure_ascii=False)}"
        
        # Для профессора ставим температуру 0.2 (немного свободы для рассуждений)
        return self._call_gemini_with_fallback(
            prompt=full_prompt, 
            schema=AIResultSchema,
            temperature=0.2
        )