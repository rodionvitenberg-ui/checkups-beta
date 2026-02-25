from ninja import Schema
from typing import Optional

class FAQSchema(Schema):
    id: int
    question: str
    answer: str

class ContentBlockSchema(Schema):
    slug: str
    title: str
    content: str
    image: Optional[str] = None

class TestimonialSchema(Schema):
    id: int
    name: str
    text: str
    avatar: Optional[str] = None

class LegalDocumentSchema(Schema):
    slug: str
    title: str
    content: str
    updated_at: str