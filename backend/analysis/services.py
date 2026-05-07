import os
import json
import time
from openai import OpenAI
from dotenv import load_dotenv

# Принудительно читаем .env
load_dotenv()

from core.schemas import AIResultSchema
from .models import PromptTemplate

class AnalysisPipeline:
    def __init__(self, language_code='ru'):
        self.api_keys = []
        
        # Ищем ключи в окружении (теперь ищем универсальные AI_API_KEY)
        for key, val in os.environ.items():
            if key.startswith("AI_API_KEY") and val:
                self.api_keys.append(val)
                
        if not self.api_keys and os.environ.get("AI_API_KEY"):
            self.api_keys.append(os.environ.get("AI_API_KEY"))
        
        if not self.api_keys:
            print("⚠️ ВНИМАНИЕ: Ключи AI_API_KEY не найдены в .env!")
            self.api_keys = ["DUMMY_KEY"]
            
        self.current_key_idx = 0
        
        # --- НАСТРОЙКИ МОДЕЛИ И ПРОВАЙДЕРА ---
        # Вариант 1: DeepSeek (Официальный API)
        self.base_url = "https://api.deepseek.com"
        self.model_name = "deepseek-chat" # Это DeepSeek V3
        
        # Вариант 2: OpenRouter (Агрегатор для Qwen, DeepSeek, Llama)
        # self.base_url = "https://openrouter.ai/api/v1"
        # self.model_name = "qwen/qwen-2.5-72b-instruct" # Или "deepseek/deepseek-chat"
        # -------------------------------------
        
        self.language_code = language_code 

    def _get_client(self):
        return OpenAI(
            api_key=self.api_keys[self.current_key_idx],
            base_url=self.base_url
        )

    def _switch_key(self):
        if self.current_key_idx < len(self.api_keys) - 1:
            self.current_key_idx += 1
            print(f"🔄 ЛИМИТЫ ИСЧЕРПАНЫ. Переключаюсь на ключ #{self.current_key_idx + 1}")
            return True
        return False

    def _call_llm_with_fallback(self, sys_prompt, user_prompt, require_json=False, max_retries=None, temperature=0.1):
        if max_retries is None:
            max_retries = len(self.api_keys) * 2

        for attempt in range(max_retries):
            try:
                client = self._get_client()
                
                messages = [
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": user_prompt}
                ]

                kwargs = {
                    "model": self.model_name,
                    "messages": messages,
                    "temperature": temperature,
                }
                
                if require_json:
                    # Стандартный вызов JSON для OpenAI/DeepSeek/OpenRouter
                    kwargs["response_format"] = {"type": "json_object"}

                response = client.chat.completions.create(**kwargs)
                result_text = response.choices[0].message.content

                if require_json:
                    return json.loads(result_text)

                return result_text

            except Exception as e:
                err_str = str(e).lower()
                print(f"⚠️ API Error (Попытка {attempt + 1}/{max_retries}): {e}")
                
                if "429" in err_str or "rate limit" in err_str or "insufficient_quota" in err_str:
                    if self._switch_key():
                        continue 
                    else:
                        print("❌ Все ключи исчерпаны! Ждем 20 сек...")
                        time.sleep(20) 
                else:
                    time.sleep(2)

        raise Exception("Failed to call AI API after multiple retries")

    def _get_prompt(self, role: str) -> str:
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
            
            # --- УМНОЕ ОБОГАЩЕНИЕ КОНТЕКСТА ДЕМОГРАФИЕЙ ИЗ БЛАНКА ---
            patient_info = raw_data.get('patient_info', {})
            ext_gender = patient_info.get('extracted_gender')
            ext_dob_str = patient_info.get('extracted_birth_date')
            ext_date_str = patient_info.get('extracted_date')
            
            additional_context = ""
            
            # Если Экстрактор нашел пол, а в профиле его нет
            if ext_gender and "Пол:" not in (patient_context or ""):
                gender_ru = "Мужской" if ext_gender.upper() == "MALE" else "Женский"
                additional_context += f"\nПол (извлечено из бланка): {gender_ru}"
                
            # Если Экстрактор нашел дату рождения, а в профиле ее нет
            if ext_dob_str and "ТОЧНЫЙ ВОЗРАСТ" not in (patient_context or ""):
                try:
                    from datetime import datetime
                    dob_year = int(ext_dob_str.split('-')[0])
                    current_year = int(ext_date_str.split('-')[0]) if ext_date_str else datetime.now().year
                    age = current_year - dob_year
                    if age >= 0:
                        additional_context += f"\nВозраст (вычислен по бланку): ~{age} лет."
                except Exception:
                    pass # Если дата в кривом формате, просто пропускаем
            
            # Приклеиваем извлеченные данные к контексту
            if additional_context:
                patient_context = (patient_context or "КОНТЕКСТ ПАЦИЕНТА:\n") + additional_context
                print(f"💡 Контекст обогащен данными из бланка: {additional_context}")

            print(f"--- Stage 2: Профессор (Interpretation) [{self.model_name}] ---")
            interpreted_data = self._step_interpret(raw_data, patient_context)
            
            return interpreted_data
            
        except Exception as e:
            print(f"Pipeline failed: {e}")
            return None

    def _step_extract(self, safe_text: str):
        sys_prompt = self._get_prompt(PromptTemplate.Role.EXTRACTOR)
        
        # --- ЖЕСТКИЕ ПРАВИЛА ДЛЯ ЭКСТРАКТОРА ---
        sys_prompt += "\n\nВАЖНО: Верни ответ СТРОГО в формате валидного JSON объекта."
        sys_prompt += f"\nCRITICAL LANGUAGE INSTRUCTION: You MUST translate and return all text values in the language corresponding to the ISO code '{self.language_code}'. The JSON keys must remain in English."
        sys_prompt += "\nCRITICAL DATE INSTRUCTION: For 'extracted_date', find the date the biomaterial was collected/taken. IGNORE the print date. Format MUST be exactly 'YYYY-MM-DD'. If unknown, return null."
        
        full_prompt = f"ОБЕЗЛИЧЕННЫЙ ТЕКСТ АНАЛИЗА:\n{safe_text}"
        
        return self._call_llm_with_fallback(
            sys_prompt=sys_prompt,
            user_prompt=full_prompt, 
            require_json=True,
            temperature=0.1 
        )

    def _step_interpret(self, raw_data: dict, patient_context: str = None):
        sys_prompt = self._get_prompt(PromptTemplate.Role.INTERPRETER)
        
        json_structure = """
        {
          "reasoning": "string",
          "patient_info": {"extracted_date": "string"}, 
          "summary": {"is_critical": boolean, "general_comment": "string"},
          "indicators": [{"slug": "string", "name": "string", "value": "string", "unit": "string", "ref_range": "string", "status": "normal|low|high|critical", "comment": "string", "category": "string"}],
          "causes": [{"title": "string", "description": "string", "severity": "green|yellow|red"}],
          "recommendations": [{"type": "string", "text": "string"}]
        }
        """
        
        strict_rules = f"""
        КРИТИЧЕСКИЕ ПРАВИЛА:
        1. LANGUAGE: You MUST translate ALL generated text (name, comment, category, reasoning, general_comment, recommendations, causes) into the language corresponding to the ISO code '{self.language_code}'. DO NOT leave it in the original language if it differs from '{self.language_code}'.
        2. JSON KEYS: All JSON keys (e.g., 'reasoning', 'patient_info', 'name') MUST remain in English exactly as shown in the structure.
        3. INDICATORS: Поле 'name' должно переноситься ДОСЛОВНО И ЦЕЛИКОМ (но переведено на '{self.language_code}'). Категорически запрещено обрезать названия.
        4. REF RANGE: Поле 'ref_range' переноси дословно из текста (например '1003 - 1035' или '< 5'). Если референса нет, ставь '-'.
        5. DATE: 'extracted_date' MUST be transferred exactly as it appears in the source text. Do not try to convert it to YYYY-MM-DD.
        """
        
        sys_prompt += f"\n\nВАЖНО: Верни ответ СТРОГО в формате валидного JSON объекта, используя следующую структуру:\n{json_structure}"
        sys_prompt += f"\n\n{strict_rules}"
        
        context_str = f"КОНТЕКСТ ПАЦИЕНТА: {patient_context}" if patient_context else "КОНТЕКСТ ПАЦИЕНТА: Неизвестен."
        full_prompt = f"{context_str}\nВОТ ИСХОДНЫЕ ДАННЫЕ (RAW JSON):\n{json.dumps(raw_data, ensure_ascii=False)}"
        
        return self._call_llm_with_fallback(
            sys_prompt=sys_prompt,
            user_prompt=full_prompt, 
            require_json=True,
            temperature=0.1 
        )