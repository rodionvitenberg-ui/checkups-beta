import os
import json
import base64
import hashlib
import requests
from django.conf import settings
from openai import OpenAI
from analysis.models import PromptTemplate
from .models import ChatSettings

class ChatAssistant:
    def __init__(self, language_code='ru'):
        self.api_keys = []
        for key, val in os.environ.items():
            if key.startswith("AI_API_KEY") and val:
                self.api_keys.append(val)
        
        self.current_key_idx = 0
        self.base_url = "https://api.deepseek.com"
        self.model_name = "deepseek-chat"
        self.language_code = language_code

    def _get_client(self):
        return OpenAI(api_key=self.api_keys[self.current_key_idx], base_url=self.base_url)

    def _switch_key(self):
        if self.current_key_idx < len(self.api_keys) - 1:
            self.current_key_idx += 1
            return True
        return False

    def _get_prompt(self) -> str:
        try:
            # Используем роль из приложения analysis
            template = PromptTemplate.objects.get(role='chat_assistant', is_active=True)
            return template.system_prompt
        except PromptTemplate.DoesNotExist:
            return "You are a helpful medical assistant."
        
    def _minify_analysis(self, full_data: dict) -> dict:
        """
        Удаляет всю текстовую 'воду' (причины, рекомендации, выводы), 
        оставляя только голые цифры и статусы для экономии токенов.
        """
        minified = {
            "summary": {
                "is_critical": full_data.get("summary", {}).get("is_critical", False)
            },
            "indicators": []
        }
        
        for ind in full_data.get("indicators", []):
            minified["indicators"].append({
                "name": ind.get("name"),
                "value": ind.get("value"),
                "unit": ind.get("unit"),
                "ref_range": ind.get("ref_range"),
                "status": ind.get("status")
            })
            
        return minified

    def stream_chat(self, analysis_data: dict, patient_context: str, chat_history: list):
        # 1. ПРОВЕРЯЕМ ТУМБЛЕР ИЗ АДМИНКИ
        settings = ChatSettings.get_settings()
        
        # Если оптимизация включена — сажаем анализ на диету!
        if settings.optimize_tokens:
            payload_data = self._minify_analysis(analysis_data)
        else:
            payload_data = analysis_data # Кидаем огромный JSON как есть

        for attempt in range(max(1, len(self.api_keys))):
            try:
                client = self._get_client()
                sys_prompt = self._get_prompt()
                
                # Используем payload_data вместо analysis_data
                context_block = f"ДАННЫЕ ПАЦИЕНТА:\n{patient_context}\n\nАНАЛИЗ (JSON):\n{json.dumps(payload_data, ensure_ascii=False)}"
                
                messages = [{"role": "system", "content": f"{sys_prompt}\n\n{context_block}"}]
                for msg in chat_history:
                    role = getattr(msg, 'role', msg.get('role') if isinstance(msg, dict) else 'user')
                    content = getattr(msg, 'content', msg.get('content') if isinstance(msg, dict) else '')
                    messages.append({"role": role, "content": content})

                response = client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    temperature=0.3,
                    stream=True
                )
                
                for chunk in response:
                    if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
                return

            except Exception as e:
                print(f"Chat stream error: {e}")
                if not self._switch_key():
                    yield "Сервис временно недоступен."

class CryptomusService:
    API_URL = "https://api.cryptomus.com/v1"
    
    def __init__(self):
        self.merchant_id = os.environ.get("CRYPTOMUS_MERCHANT_ID")
        self.payment_key = os.environ.get("CRYPTOMUS_API_KEY")

    def _get_signature(self, payload: dict) -> str:
        # Cryptomus требует md5 от base64(json) + API_KEY
        json_str = json.dumps(payload, separators=(',', ':'))
        encoded_payload = base64.b64encode(json_str.encode('utf-8')).decode('utf-8')
        return hashlib.md5(f"{encoded_payload}{self.payment_key}".encode('utf-8')).hexdigest()

    def create_payment(self, order_id: str, amount: str, email: str) -> str:
        """Создает платеж и возвращает URL для редиректа юзера"""
        payload = {
            "amount": str(amount),
            "currency": "USD",
            "order_id": str(order_id),
            "url_return": "https://твой_домен/dashboard", # Куда вернуть юзера после оплаты
            "url_callback": "https://твой_домен/api/premium/payment/webhook" # Куда придет Webhook
        }
        
        headers = {
            "merchant": self.merchant_id,
            "sign": self._get_signature(payload),
            "Content-Type": "application/json"
        }
        
        response = requests.post(f"{self.API_URL}/payment", json=payload, headers=headers)
        data = response.json()
        
        if data.get("state") == 0:
            return data["result"]["url"] # Возвращаем ссылку на оплату
        raise Exception(f"Cryptomus error: {data}")

    def verify_webhook(self, data: dict, sign: str) -> bool:
        """Проверяет подлинность вебхука"""
        dict_copy = data.copy()
        dict_copy.pop('sign', None) # Удаляем подпись из тела перед проверкой
        
        # Сортируем ключи и собираем обратно (требование Cryptomus)
        # Для упрощения: в проде лучше использовать raw_body + API_KEY, если фреймворк позволяет.
        # В нашем случае полагаемся на логику md5(json + key)
        json_str = json.dumps(dict_copy, separators=(',', ':'))
        encoded = base64.b64encode(json_str.encode('utf-8')).decode('utf-8')
        expected_sign = hashlib.md5(f"{encoded}{self.payment_key}".encode('utf-8')).hexdigest()
        
        return sign == expected_sign