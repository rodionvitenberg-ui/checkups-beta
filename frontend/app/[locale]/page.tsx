// Обрати внимание: 'use client' удален! Теперь это сверхбыстрый серверный компонент.

import StaticBackground from '@/components/background/StaticBackground';
import { HeroSection } from '@/components/home/HeroSection';
import { FileUploader } from '@/components/home/FileUploader';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { ExampleButtonSection } from '@/components/home/ExampleButtonSection';
import FAQSection from '@/components/home/FAQ';
import { AnimatedTestimonialsSection } from '@/components/home/AnimatedTestimonialsSection';

export default function Home() {
  return (
    <main className="relative min-h-screen">
      
      <StaticBackground imageUrl="/background/main-page.png" />

      {/* ОГРАНИЧЕННЫЙ КОНТЕЙНЕР ДЛЯ ОСНОВНОГО КОНТЕНТА */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12 md:pt-32 md:pb-20">
        
        {/* 1. ГЛАВНЫЙ БЛОК (О ПРОЕКТЕ) */}
        <HeroSection />

        {/* 2. ЗАГРУЗКА ФАЙЛОВ */}
        <section className="mb-24">
           <FileUploader />
        </section>

        {/* 3. БЛОК ПРЕИМУЩЕСТВ */}
        {/* Тексты теперь живут внутри самого компонента FeaturesSection */}
        <FeaturesSection />

        {/* 4. КНОПКА ПРИМЕРА */}
        <ExampleButtonSection />

        {/* 5. FAQ */}
        <section>
          <FAQSection />
        </section>

      </div> 

    </main>
  );
}