from ninja import Router
from ninja import Form, File, UploadedFile
from ninja_jwt.authentication import JWTAuth
from typing import List
from django.shortcuts import get_object_or_404
from .models import FAQItem, ContentBlock, Testimonial
from .schemas import FAQSchema, ContentBlockSchema, TestimonialSchema

# Создаем отдельный роутер для CMS
cms_router = Router()

@cms_router.get("/faq", response=List[FAQSchema])
def get_faq(request):
    """Получить все активные вопросы FAQ"""
    return FAQItem.objects.filter(is_active=True)

@cms_router.get("/blocks/{slug}", response=ContentBlockSchema)
def get_content_block(request, slug: str):
    """Получить текстовый блок по его slug"""
    block = get_object_or_404(ContentBlock, slug=slug)
    return block

@cms_router.get("/blocks", response=List[ContentBlockSchema])
def get_all_blocks(request):
    """Получить сразу все текстовые блоки (удобно для загрузки при старте)"""
    return ContentBlock.objects.all()
@cms_router.get("/testimonials", response=List[TestimonialSchema])
def get_testimonials(request):
    return Testimonial.objects.filter(is_published=True).order_by('-created_at')

@cms_router.post("/testimonials", response=TestimonialSchema, auth=JWTAuth())
def create_testimonial(
    request, 
    name: str = Form(...), 
    text: str = Form(...), 
    avatar: UploadedFile = File(None)
):
    testimonial = Testimonial.objects.create(
        user=request.user,
        name=name,
        text=text,
        avatar=avatar
    )
    return testimonial