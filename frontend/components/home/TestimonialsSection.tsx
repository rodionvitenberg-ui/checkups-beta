'use client';

// import { useState, useRef } from 'react';
// import { useRouter } from 'next/navigation';
import TestimonialCarousel from '@/components/ui/testimonial-carousel';
// import { Button } from "@/components/ui/button";
// import { MessageSquarePlus, X, Upload } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useQuery /*, useMutation, useQueryClient*/ } from '@tanstack/react-query';
import { getTestimonials /*, createTestimonial*/ } from '@/lib/api';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace('/api', '');

// Функция генерации заглушки-аватарки
const generateAvatar = (name: string) => {
  const letter = name.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#3b82f6"/><text x="50" y="54" font-family="system-ui, sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>`;
  return `data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(svg))) : ''}`;
};

// БАЗОВЫЕ ОТЗЫВЫ ОТ ЗАКАЗЧИКА
const defaultTestimonials = [
  {
    description: "Благодаря этому сервису мне не нужно сразу бежать к терапевту. Я получила полную картину по моим анализам, что позволило мне лучше понять состояние моего здоровья.",
    image: '/ava1.jpg', // Берет файл frontend/public/ava1.jpg
    name: 'Ирина',
    handle: '29 лет, Москва'
  },
  {
    description: "Регулярно делаю чекап. Загрузил несколько своих последних анализов и заметил ухудшение динамики по нескольким показателям. Это помогло вовремя обратиться к врачу.",
    image: '/ava2.jpg', // Берет файл frontend/public/ava2.jpg
    name: 'Максим',
    handle: '41 год, Новосибирск'
  },
  {
    description: "Очень хорошо, что появился такой сервис. Загрузила анализы своего сына, поняла, в чем могут причины постоянных болезней.",
    image: '/ava3.jpg', // Берет файл frontend/public/ava3.jpg
    name: 'Светлана',
    handle: '23 года, Екатеринбург'
  },
  {
    description: "Была постоянная слабость. Сделал анализы и загрузил в сервис. Оказывается причиной слабости и отсутствия энергии было недостаточное количество магния, ферритина и тестостерона. Сервис дал отличные рекомендации. Посоветовался с врачами и своим тренером. Причины подтвердились. Теперь пью БАДы и жизнь наладилась.",
    image: '/ava4.jpg', // Берет файл frontend/public/ava4.jpg
    name: 'Константин',
    handle: '45 лет, Чита'
  }
];

export function TestimonialsSection() {
  // --- ЗАКОММЕНТИРОВАННЫЙ ФУНКЦИОНАЛ ФОРМЫ ---
  // const router = useRouter();
  // ... (весь старый закомментированный код остается как был)
  
  // Получаем отзывы из БД (оставляем, чтобы тянуть отзывы, добавленные через админку)
  const { data: testimonials = [], isLoading } = useQuery({
      queryKey: ['testimonials'],
      queryFn: getTestimonials
  });

  // 1. Форматируем отзывы из БД (если они там появятся)
  const dbTestimonials = testimonials.map(t => ({
      description: t.text,
      image: t.avatar ? `${BACKEND_URL}${t.avatar}` : generateAvatar(t.name),
      name: t.name,
      handle: '@' + t.name.toLowerCase().replace(/\s+/g, '_')
  }));

  // 2. Склеиваем: сначала новые из БД, потом базовые
  const displayData = [...dbTestimonials, ...defaultTestimonials];

  return (
    <section className="py-16 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">
          Что говорят пользователи
        </h2>
        
        {isLoading ? (
            <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        ) : (
            <div className="mb-10 [&_.lucide-arrow-left]:hidden [&_.lucide-arrow-right]:hidden [&_button[class*='absolute']]:hidden">
              <TestimonialCarousel data={displayData} />
            </div>
        )}
      </div>
    </section>
  );
}