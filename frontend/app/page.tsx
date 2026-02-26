'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { getBlocks, ContentBlock } from '@/lib/api';
import { FileUploader } from '@/components/home/FileUploader';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { Activity, Brain, ShieldCheck, FileClock, ArrowRight, Image as ImageIcon, Loader2 } from 'lucide-react';

// ШАГ 1: Импортируем наш компонент-обертку
import StaticBackground from '@/components/background/StaticBackground';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace('/api', '');

export default function Home() {
  const { data: blocks = [], isLoading } = useQuery({
      queryKey: ['contentBlocks'],
      queryFn: getBlocks
  });

  const blocksMap = blocks.reduce((acc, block) => {
      acc[block.slug] = block;
      return acc;
  }, {} as Record<string, ContentBlock>);

  const heroBlock = blocksMap['home_hero'];
  const feat1 = blocksMap['feature_1'];
  const feat2 = blocksMap['feature_2'];
  const feat3 = blocksMap['feature_3'];
  const feat4 = blocksMap['feature_4'];

  if (isLoading) {
      return (
          // ШАГ 2: Главный контейнер должен иметь класс relative
          <main className="relative min-h-screen flex items-center justify-center">
              {/* ШАГ 3: Вызываем фон (даже для состояния загрузки) */}
              <StaticBackground imageUrl="/background/main-page.png" />
              {/* ШАГ 4: Оборачиваем лоадер в z-10, чтобы он был поверх фона */}
              <div className="relative z-10">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              </div>
          </main>
      );
  }

  return (
    // ШАГ 2: Главный контейнер заменяем на main с классом relative
    <main className="relative min-h-screen">
      
      {/* ШАГ 3: Вставляем сам фон. Путь указывается от корня папки public/ */}
      <StaticBackground imageUrl="/background/main-page.png" />

      {/* ШАГ 4: Поднимаем весь контент над фоном. Для этого нужны классы relative и z-10 */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12 md:pt-32 md:pb-20">
        
        {/* 1. ГЛАВНЫЙ БЛОК (О ПРОЕКТЕ) */}
        <section className="flex flex-col md:flex-row-reverse gap-12 items-center mb-16">
  {/* Текст справа */}
  <div className="w-full md:w-1/2 space-y-6 text-left">
    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 uppercase">
      {heroBlock?.title || "О ПРОЕКТЕ"}
    </h1>
    <div className="prose prose-lg text-slate-600 leading-relaxed">
      <p className="whitespace-pre-wrap">
        {heroBlock?.content || "Checkups — бесплатный интеллектуальный AI-сервис по интерпретации медицинских анализов..."}
      </p>
    </div>
  </div>

  {/* Изображение слева (без фона и границ) */}
  <div className="w-full md:w-1/2 flex justify-center items-center">
    <div className="relative w-full group">
        {heroBlock?.image ? (
            <img 
                src={`${BACKEND_URL}${heroBlock.image}`} 
                alt={heroBlock?.title || "О проекте"} 
                className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105"
            />
        ) : (
            <div className="text-center text-slate-400 p-12 border-2 border-dashed border-slate-200 rounded-3xl">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <span className="text-sm font-medium">Главное изображение<br/>(добавьте в CMS блок "home_hero")</span>
            </div>
        )}
    </div>
  </div>
</section>

        {/* 2. ЗАГРУЗКА ФАЙЛОВ */}
        <section className="mb-24">
           <FileUploader />
        </section>

        {/* 3. БЛОК ПРЕИМУЩЕСТВ */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          {/* ... карточки преимуществ остаются без изменений ... */}
          <div className="bg-transparent backdrop-blur-md p-6 rounded-2xl shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-blue-600">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              {feat1?.title || "Динамика"}
            </h3>
            <p className="text-slate-600 text-sm">
              {feat1?.content || "Сравниваем новые результаты со старыми, строим наглядные графики изменений."}
            </p>
          </div>
          {/* ... остальные карточки аналогично ... */}
          <div className="bg-transparent backdrop-blur-md p-6 rounded-2xl shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-indigo-600">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              {feat2?.title || "Анализ"}
            </h3>
            <p className="text-slate-600 text-sm">
              {feat2?.content || "Используем ИИ для поиска скрытых связей между различными показателями крови."}
            </p>
          </div>
          <div className="bg-transparent backdrop-blur-md p-6 rounded-2xl shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
              <FileClock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              {feat3?.title || "История"}
            </h3>
            <p className="text-slate-600 text-sm">
              {feat3?.content || "Храним все ваши медицинские документы и анализы в одном надежном месте."}
            </p>
          </div>
          <div className="bg-transparent backdrop-blur-md p-6 rounded-2xl shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-rose-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              {feat4?.title || "Риски и последствия"}
            </h3>
            <p className="text-slate-600 text-sm">
              {feat4?.content || "Рассказываем о том, что может произойти, если те или иные показатели будут ухудшаться."}
            </p>
          </div>
        </section>

        {/* 4. Кнопка "Посмотреть пример" */}
        <section className="mb-24 relative">
          <Link 
            href="/example-analysis"
            className="group relative block w-full max-w-2xl mx-auto transition-all duration-300 transform hover:-translate-y-1"
          >
            {/* Сама картинка кнопки */}
            <div className="relative w-full aspect-[672/128] drop-shadow-xl group-hover:drop-shadow-2xl transition-all">
                <Image 
                    src="/buttons/bigbutton.png" 
                    alt="Посмотреть пример" 
                    fill
                    className="object-contain"
                    priority
                />
            </div>

            {/* Текст поверх кнопки */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg sm:text-xl font-bold text-slate-800 uppercase tracking-tight">
                    Посмотреть пример разбора
                </span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-slate-700 text-xs sm:text-sm font-medium mt-0.5 opacity-90">
                Узнайте, как выглядит готовый отчет с графиками и рекомендациями
              </p>
            </div>
          </Link>
        </section>

        {/* 5. ОТЗЫВЫ */}
        <section>
          <TestimonialsSection />
        </section>

      </div>
    </main>
  );
}