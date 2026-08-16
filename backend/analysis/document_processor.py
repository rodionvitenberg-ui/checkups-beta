"""
DocumentProcessor: единый модуль обработки документа (deep module).

Интерфейс: process(file_data: bytes, filename: str) -> str (безопасный текст).
Вся сложность внутри: OCR (векторный PDF / скан / картинка) + анонимизация Presidio.
"""
import os
from io import BytesIO

import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes
from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine

# --- НАСТРОЙКА PRESIDIO ДЛЯ МУЛЬТИЯЗЫЧНОСТИ ---
_nlp_configuration = {
    "nlp_engine_name": "spacy",
    "models": [
        {"lang_code": "en", "model_name": "en_core_web_sm"},
        {"lang_code": "ru", "model_name": "ru_core_news_sm"},
        {"lang_code": "es", "model_name": "es_core_news_md"},
    ],
}
_nlp_engine = NlpEngineProvider(nlp_configuration=_nlp_configuration).create_engine()
_analyzer = AnalyzerEngine(nlp_engine=_nlp_engine, supported_languages=["en", "ru", "es"])
_anonymizer = AnonymizerEngine()

# Явно указываем Presidio, ЧТО именно вырезать.
# Мы НЕ включаем сюда 'DATE_TIME', чтобы даты дошли до нейросети!
MASKING_ENTITIES = [
    "PERSON",
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "LOCATION",
    "CREDIT_CARD",
    "CRYPTO",
]


def _extract_raw_text(file_data: bytes, filename: str) -> str:
    """Извлекает сырой текст из PDF/изображения (векторный PDF или OCR)."""
    ext = os.path.splitext(filename)[1].lower()
    text = ""

    if ext == '.pdf':
        try:
            doc = fitz.open(stream=file_data, filetype='pdf')
            text = "\n".join([page.get_text("text") for page in doc])
            doc.close()

            # Если текста почти нет (это скан или фото внутри PDF) -> включаем OCR
            if len(text.strip()) < 100:
                print("📄 PDF выглядит как скан. Запускаю OCR-движок...")
                images = convert_from_bytes(file_data)
                text = ""
                for img in images:
                    # lang='rus+eng' критически важно для мед. терминов на латыни
                    text += pytesseract.image_to_string(img, lang='rus+eng') + "\n"
        except Exception as e:
            print(f"❌ Ошибка чтения PDF: {e}")

    elif ext in ['.jpg', '.jpeg', '.png']:
        print("🖼️ Распознаю изображение через OCR...")
        try:
            img = Image.open(BytesIO(file_data))
            text = pytesseract.image_to_string(img, lang='rus+eng')
        except Exception as e:
            print(f"❌ Ошибка чтения изображения: {e}")

    return text


def process_document(file_data: bytes, filename: str) -> str:
    """OCR + анонимизация. Возвращает безопасный текст, готовый к отправке в LLM."""
    raw_text = _extract_raw_text(file_data, filename)

    if not raw_text.strip():
        return ""

    pii_ru = _analyzer.analyze(text=raw_text, language='ru', entities=MASKING_ENTITIES)
    pii_en = _analyzer.analyze(text=raw_text, language='en', entities=MASKING_ENTITIES)
    pii_es = _analyzer.analyze(text=raw_text, language='es', entities=MASKING_ENTITIES)

    anonymized_result = _anonymizer.anonymize(
        text=raw_text,
        analyzer_results=pii_ru + pii_en + pii_es,
    )
    return anonymized_result.text