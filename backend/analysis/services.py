import json

from core.llm import LLMClient
from .models import PromptTemplate

class AnalysisPipeline:
    def __init__(self, language_code='ru'):
        self.llm = LLMClient(base_url="https://api.deepseek.com", model_name="deepseek-chat")
        self.language_code = language_code

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
            print(f"--- Stage 1: Секретарь (Extraction) [{self.llm.model_name}, Lang: {self.language_code}] ---")
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

            print(f"--- Stage 2: Профессор (Interpretation) [{self.llm.model_name}] ---")
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
        
        return self.llm.complete(
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
        
        return self.llm.complete(
            sys_prompt=sys_prompt,
            user_prompt=full_prompt,
            require_json=True,
            temperature=0.1
        )
