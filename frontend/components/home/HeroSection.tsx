import { useTranslations } from 'next-intl';

export function HeroSection() {
  // Подключаем пространство имен 'Hero'
  const t = useTranslations('Hero');

  return (
    <section className="flex flex-col md:flex-row-reverse gap-12 lg:gap-20 items-center mb-24 md:mb-32">
      <div className="w-full md:w-3/5 space-y-8 text-left">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-secondary uppercase leading-[0.9]">
          {t('title')}
        </h1>
        <div className="prose prose-xl text-accent leading-relaxed font-medium">
          <p className="whitespace-pre-wrap text-md md:text-md lg:text-xl opacity-90">
            {t('description')}
          </p>
        </div>
      </div>

      <div className="w-full md:w-2/5 flex justify-center items-center">
        <div className="relative w-full max-w-[320px] md:max-w-[400px] lg:max-w-[450px] group">
          <img 
            src="/arts/5.png" 
            alt={t('imageAlt')} 
            className="w-full h-auto object-contain transition-all duration-1000 group-hover:scale-105 group-hover:rotate-1"
          />
        </div>
      </div>
    </section>
  );
}