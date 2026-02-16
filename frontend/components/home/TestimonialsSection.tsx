"use client";

import TestimonialCarousel from '@/components/ui/testimonial-carousel';
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";

const reviews = [
  {
    description:
      'Сервис помог мне успокоиться перед визитом к врачу. Я загрузил PDF с кровью, и ИИ четко объяснил, почему повышены лейкоциты. Оказалось, это просто остаточное после простуды.',
    image:
      'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2080&auto=format&fit=crop',
    name: 'Алексей Смирнов',
    handle: '@alex_smirnov',
  },
  {
    description:
      'Очень удобно хранить все анализы в одном месте. Раньше я терял бумажки из лабораторий, а теперь просто фоткаю и загружаю сюда. Жду функцию динамики!',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=2070&auto=format&fit=crop',
    name: 'Мария Иванова',
    handle: '@maria_iv',
  },
  {
    description:
      'Как студент-медик, я тестировал этот ИИ на сложных кейсах. Интерпретация удивительно точная для автоматической системы. Хорошее "второе мнение".',
    image:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop',
    name: 'Дмитрий Козлов',
    handle: '@doc_dimka',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 border-t border-slate-100 bg-slate-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">
          Что говорят пользователи
        </h2>
        
        {/* Карусель отзывов */}
        <div className="mb-10">
          <TestimonialCarousel data={reviews} />
        </div>

        {/* Кнопка добавления отзыва */}
        <Button 
          variant="outline" 
          size="lg"
          className="rounded-full border-slate-300 hover:bg-white hover:text-blue-600 transition-colors"
          onClick={() => alert("Форма отзыва будет доступна позже")} // Заглушка
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          Добавить свой отзыв
        </Button>
      </div>
    </section>
  );
}