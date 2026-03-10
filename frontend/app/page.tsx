'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { getBlocks, ContentBlock } from '@/lib/api';
import { FileUploader } from '@/components/home/FileUploader';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { TestimonialsAlt } from '@/components/home/TestimonialsAlt';
import { Activity, Brain, ShieldCheck, FileClock, ArrowRight, Image as ImageIcon, Loader2 } from 'lucide-react';
import FAQSection from '@/components/home/FAQ';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { MorphyButton } from "@/components/ui/morphy-button";
import { AnimatedTestimonialsSection } from '@/components/home/AnimatedTestimonialsSection';
import { clsx } from 'clsx';

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
          <main className="relative min-h-screen flex items-center justify-center">
              <StaticBackground imageUrl="/background/main-page.png" />
              <div className="relative z-10">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              </div>
          </main>
      );
  }

  return (
    <main className="relative min-h-screen">
      
      <StaticBackground imageUrl="/background/main-page.png" />

      {/* ОГРАНИЧЕННЫЙ КОНТЕЙНЕР (С ОТСТУПАМИ И MAX-W) ДЛЯ ОСНОВНОГО КОНТЕНТА */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12 md:pt-32 md:pb-20">
        
        {/* 1. ГЛАВНЫЙ БЛОК (О ПРОЕКТЕ) */}
        <section className="flex flex-col md:flex-row-reverse gap-12 lg:gap-20 items-center mb-24 md:mb-32">
          <div className="w-full md:w-3/5 space-y-8 text-left">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-slate-900 uppercase leading-[0.9]">
              {heroBlock?.title || "О ПРОЕКТЕ"}
            </h1>
            <div className="prose prose-xl text-slate-700 leading-relaxed font-medium">
              <p className="whitespace-pre-wrap text-md md:text-md lg:text-xl opacity-90">
                {heroBlock?.content || "Checkups — бесплатный интеллектуальный AI-сервис по интерпретации медицинских анализов..."}
              </p>
            </div>
          </div>

          <div className="w-full md:w-2/5 flex justify-center items-center">
            <div className="relative w-full max-w-[320px] md:max-w-[400px] lg:max-w-[450px] group">
                {heroBlock?.image ? (
                    <img 
                        src={`${BACKEND_URL}${heroBlock.image}`} 
                        alt={heroBlock?.title || "О проекте"} 
                        className="w-full h-auto object-contain transition-all duration-1000 group-hover:scale-105 group-hover:rotate-1"
                    />
                ) : (
                    <div className="text-center text-slate-400 p-12 border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/5">
                        <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <span className="text-sm font-medium">Главное изображение</span>
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
        <FeaturesSection 
          feat1={feat1} 
          feat2={feat2} 
          feat3={feat3} 
          feat4={feat4} 
        />

        {/* 4. Кнопка "Посмотреть пример" */}
        <section className="mb-24 relative px-4">
          <Link 
            href="/example-analysis"
            className="block w-full max-w-2xl mx-auto"
          >
            <div className="md:hidden">
              <MorphyButton 
                className="w-full py-8 text-white text-md font-bold tracking-tight shadow-lg"
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <span>Посмотреть пример разбора</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] opacity-80 font-sm normal-case">
                    Отчет с графиками и рекомендациями
                  </span>
                </div>
              </MorphyButton>
            </div>

            <div className="hidden md:block group relative transition-all duration-500">
              <div className={clsx(
                "relative w-full aspect-[672/128] transition-all duration-500",
                "drop-shadow-[0_10px_15px_rgba(226,232,240,0.8)] group-hover:drop-shadow-[0_20px_25px_rgba(191,219,254,0.8)]",
                "transform-gpu group-hover:-translate-y-1.5 will-change-transform"
              )}>
                  <Image 
                      src="/buttons/bigbutton.png" 
                      alt="Посмотреть пример" 
                      fill
                      className="object-contain"
                      priority
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 z-10">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                          Посмотреть пример разбора
                      </span>
                      <ArrowRight className="w-5 h-5 text-slate-800 group-hover:translate-x-1 transition-transform duration-300 transform-gpu" />
                    </div>
                    <p className="text-slate-700 text-sm font-medium mt-0.5 opacity-90">
                      Узнайте, как выглядит готовый отчет с графиками и рекомендациями
                    </p>
                  </div>
              </div>
            </div>
          </Link>
        </section>

        {/* 5. FAQ */}
        <section>
          <FAQSection />
        </section>

      </div> {/* ЗАКРЫВАЕМ ОГРАНИЧЕННЫЙ КОНТЕЙНЕР ЗДЕСЬ */}

      {/* 6. ОТЗЫВЫ (FULL-WIDTH КОНТЕЙНЕР) */}
      {/* Этот блок вынесен наружу и занимает 100% ширины экрана, игнорируя px-4 и max-w-6xl */}
      <section className="relative z-10 w-full overflow-hidden pb-20">
        <AnimatedTestimonialsSection />
      </section>

    </main>
  );
}