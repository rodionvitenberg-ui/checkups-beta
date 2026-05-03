import Image from 'next/image';
import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import { Stethoscope, WarningCircle, Folders, TrendDown } from '@phosphor-icons/react/dist/ssr'; // Для серверных компонентов лучше импортировать из /ssr

export const FeaturesSection = () => {
  const t = useTranslations('Features');

  // Определяем массив внутри, получая данные из next-intl
  const features = [
    {
      title: t('feature1.title'),
      content: t('feature1.content'),
      image: "/arts/1.png",
      icon: <Stethoscope weight="duotone" className="w-8 h-8" />,
    },
    {
      title: t('feature2.title'),
      content: t('feature2.content'),
      image: "/arts/2.png",
      icon: <WarningCircle weight="duotone" className="w-8 h-8" />,
    },
    {
      title: t('feature3.title'),
      content: t('feature3.content'),
      image: "/arts/3.png",
      icon: <Folders weight="duotone" className="w-8 h-8" />,
    },
    {
      title: t('feature4.title'),
      content: t('feature4.content'),
      image: "/arts/4.png",
      icon: <TrendDown weight="duotone" className="w-8 h-8" />,
    },
  ];

  return (
    <section className="flex flex-col gap-8 md:gap-12 mb-20"> 
      {features.map((feature, index) => {
        const isEven = index % 2 === 0;

        return (
          <div 
            key={index} 
            className={clsx(
                "flex flex-col md:items-center gap-6 md:gap-10", 
                isEven ? "md:flex-row" : "md:flex-row-reverse"
            )}
          >
            {/* БЛОК С ИЗОБРАЖЕНИЕМ */}
            <div className="w-full md:w-5/12 flex justify-center items-center">
              <div className="relative w-full max-w-[280px] md:max-w-[320px] aspect-square">
                <Image 
                    src={feature.image} 
                    alt={feature.title} 
                    fill
                    className="object-contain transition-transform duration-700 hover:scale-105"
                    sizes="(max-w-1080px) 280px, 320px"
                />
              </div>
            </div>

            {/* БЛОК С ТЕКСТОМ И ПОДЛОЖКОЙ */}
            <div className="w-full md:w-7/12">
              <div className="bg-white/15 backdrop-blur-lg p-8 md:p-12 rounded-[2.5rem] border border-white/30 shadow-sm transition-all duration-300 hover:bg-white/20 hover:scale-[1.02] hover:shadow-xl">

                  {/* Обертка для иконки и заголовка в одну строку */}
                  <div className="flex items-center gap-4 md:gap-5 mb-4 md:mb-6">
                    {/* Контейнер для иконки */}
                    <div className="shrink-0 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/50 text-secondary shadow-sm">
                      {feature.icon}
                    </div>

                    {/* Заголовок */}
                    <h3 className="font-bold text-xl md:text-2xl text-secondary uppercase tracking-tighter leading-tight m-0">
                      {feature.title}
                    </h3>
                  </div>
                  
                  <p className="text-accent text-base md:text-lg font-medium leading-relaxed opacity-90">
                    {feature.content}
                  </p>
              </div>
            </div>

          </div>
        );
      })}
    </section>
  );
};