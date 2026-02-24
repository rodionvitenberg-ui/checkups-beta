'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getBlocks, ContentBlock } from '@/lib/api';
import { FileUploader } from '@/components/home/FileUploader';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { Activity, Brain, ShieldCheck, FileClock, ArrowRight, Image as ImageIcon, Loader2 } from 'lucide-react';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace('/api', '');

export default function Home() {
  // Получаем текстовые блоки из нашей CMS
  const { data: blocks = [], isLoading } = useQuery({
      queryKey: ['contentBlocks'],
      queryFn: getBlocks
  });

  // Превращаем массив в удобный словарь по ключу (slug)
  const blocksMap = blocks.reduce((acc, block) => {
      acc[block.slug] = block;
      return acc;
  }, {} as Record<string, ContentBlock>);

  // Достаем блоки
  const heroBlock = blocksMap['home_hero'];
  const feat1 = blocksMap['feature_1'];
  const feat2 = blocksMap['feature_2'];
  const feat3 = blocksMap['feature_3'];
  const feat4 = blocksMap['feature_4'];

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        
        {/* 1. ГЛАВНЫЙ БЛОК (О ПРОЕКТЕ) */}
        <section className="flex flex-col md:flex-row gap-12 items-center mb-16">
          
          {/* Левая колонка: Жирный заголовок и текст из CMS */}
          <div className="w-full md:w-1/2 space-y-6 text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 uppercase">
              {heroBlock?.title || "О ПРОЕКТЕ"}
            </h1>
            <div className="prose prose-lg text-slate-600 leading-relaxed">
              <p className="whitespace-pre-wrap">
                {heroBlock?.content || "Checkups — бесплатный интеллектуальный AI-сервис по интерпретации медицинских анализов. Мы используем новейшие AI-модели для анализа результатов ваших медицинских анализов, объясняем возможные причины отклонений от нормы.\n\nБлагодаря нам вы можете лучше понять первичную картину состояния вашего здоровья. Мы не ставим диагнозов, мы помогаем вам получить независимое мнение, основанное на новейших технологиях искусственного интеллекта."}
              </p>
            </div>
          </div>

          {/* Правая колонка: Изображение из CMS */}
          <div className="w-full md:w-1/2">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-slate-300 bg-slate-50 flex items-center justify-center group">
                {heroBlock?.image ? (
                    <img 
                        src={`${BACKEND_URL}${heroBlock.image}`} 
                        alt={heroBlock?.title || "О проекте"} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                ) : (
                    <div className="text-center text-slate-400">
                        <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <span className="text-sm font-medium">Главное изображение<br/>(добавьте в CMS блок "home_hero")</span>
                    </div>
                )}
            </div>
          </div>
        </section>

        {/* 2. ЗАГРУЗКА ФАЙЛОВ (Сразу под главным блоком) */}
        <section className="mb-24">
           <FileUploader />
        </section>

        {/* 3. БЛОК ПРЕИМУЩЕСТВ (Сетка 2x2) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          
          {/* Карточка 1 */}
          <div className="bg-slate-50 p-6 rounded-2xl hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              {feat1?.title || "Динамика"}
            </h3>
            <p className="text-slate-600 text-sm">
              {feat1?.content || "Сравниваем новые результаты со старыми, строим наглядные графики изменений."}
            </p>
          </div>

          {/* Карточка 2 */}
          <div className="bg-slate-50 p-6 rounded-2xl hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 text-indigo-600">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              {feat2?.title || "Анализ"}
            </h3>
            <p className="text-slate-600 text-sm">
              {feat2?.content || "Используем ИИ для поиска скрытых связей между различными показателями крови."}
            </p>
          </div>

          {/* Карточка 3 */}
          <div className="bg-slate-50 p-6 rounded-2xl hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
              <FileClock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              {feat3?.title || "История"}
            </h3>
            <p className="text-slate-600 text-sm">
              {feat3?.content || "Храним все ваши медицинские документы и анализы в одном надежном месте."}
            </p>
          </div>

          {/* Карточка 4 */}
          <div className="bg-slate-50 p-6 rounded-2xl hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mb-4 text-rose-600">
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
        <section className="mb-24">
          <Link 
            href="/example-analysis"
            className="group block w-full max-w-2xl mx-auto bg-secondary hover:bg-accent text-white rounded-3xl py-6 px-8 text-center transition-all duration-300 transform hover:-translate-y-1 shadow-xl hover:shadow-2xl"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl font-semibold">Посмотреть пример разбора</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-white text-sm mt-1">
              Узнайте, как выглядит готовый отчет с графиками и рекомендациями
            </p>
          </Link>
        </section>

        {/* 5. ОТЗЫВЫ */}
        <section>
          <TestimonialsSection />
        </section>

      </div>
    </div>
  );
}