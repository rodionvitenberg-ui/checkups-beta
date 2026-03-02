'use client';

import Image from 'next/image';
import { Stethoscope, Activity, ClipboardList, Thermometer } from 'lucide-react';
import { ContentBlock } from '@/lib/api';
import { clsx } from 'clsx';

interface FeaturesSectionProps {
  feat1?: ContentBlock;
  feat2?: ContentBlock;
  feat3?: ContentBlock;
  feat4?: ContentBlock;
}

export const FeaturesSection = ({ feat1, feat2, feat3, feat4 }: FeaturesSectionProps) => {
  const features = [
    {
      title: feat1?.title || "ВЫПОЛНЯЕТ РОЛЬ ВИРТУАЛЬНОГО ТЕРАПЕВТА:",
      content: feat1?.content || "Отсматривает ваши результаты анализов, выявляет зоны риска, при этом вы экономите время и деньги.",
      image: "/arts/1.png",
      icon: <Stethoscope className="w-7 h-7" />,
      color: "text-blue-500"
    },
    {
      title: feat2?.title || "РАССКАЗЫВАЕТ О ВОЗМОЖНЫХ ПРИЧИНАХ:",
      content: feat2?.content || "В отличии от анализов, где просто показаны отклонения от нормы, наш ИИ указывает на возможные причины.",
      image: "/arts/2.png",
      icon: <Activity className="w-7 h-7" />,
      color: "text-rose-500"
    },
    {
      title: feat3?.title || "ХРАНИТ ВСЕ В ОДНОМ МЕСТЕ:",
      content: feat3?.content || "У вас всегда будет доступ ко всем анализам, которые вы расшифровали у нас, а мы реализуем функцию сравнения в динамике.",
      image: "/arts/3.png",
      icon: <ClipboardList className="w-7 h-7" />,
      color: "text-emerald-500"
    },
    {
      title: feat4?.title || "УКАЗЫВАЕТ НА РИСКИ И ПОСЛЕДСТВИЯ:",
      content: feat4?.content || "Рассказываем о том, что может произойти, если те или иные показатели будут ухудшаться.",
      image: "/arts/4.png",
      icon: <Thermometer className="w-7 h-7" />,
      color: "text-amber-500"
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
              <div className="bg-white/15 backdrop-blur-lg p-8 md:p-12 rounded-[2.5rem] border border-white/30 shadow-sm transition-all duration-300 hover:bg-white/20">
                  
                  {/* Иконка теперь аккуратно вписана над заголовком */}
                  <div className={clsx("mb-4 flex items-center justify-center w-12 h-12 rounded-2xl bg-white/40 shadow-inner", feature.color)}>
                    {feature.icon}
                  </div>

                  <h3 className="font-extrabold text-xl md:text-1xl text-slate-900 mb-4 uppercase tracking-tighter leading-tight">
                    {feature.title}
                  </h3>
                  
                  <p className="text-slate-700 text-base md:text-md font-medium leading-relaxed opacity-90">
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