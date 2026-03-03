import React from 'react';
import { cn } from '@/lib/utils';

export interface Testimonial {
  name: string;
  image: string;
  description: string;
  handle: string;
}

interface AnimatedCanopyProps extends React.HTMLAttributes<HTMLDivElement> {
  repeat?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
}

const AnimatedCanopy = ({
  children,
  repeat = 4,
  pauseOnHover = true,
  reverse = false,
  className,
  ...props
}: AnimatedCanopyProps) => (
  <div
    {...props}
    className={cn(
      // Класс group нужен, чтобы отслеживать наведение на весь ряд
      'group relative flex w-full overflow-hidden p-4 gap-[var(--gap)] [--gap:24px]',
      className,
    )}
  >
    {Array.from({ length: repeat }).map((_, index) => (
      <div
        key={`item-${index}`}
        className={cn(
          'flex shrink-0 gap-[var(--gap)] flex-row animate-canopy-horizontal',
          // Добавляем наши кастомные классы (они описаны в <style> ниже)
          reverse && 'direction-reverse',
          pauseOnHover && 'pause-on-hover'
        )}
      >
        {children}
      </div>
    ))}
  </div>
);

const TestimonialCard = ({
  testimonial,
  className,
}: {
  testimonial: Testimonial;
  className?: string;
}) => (
  <div
    className={cn(
      'flex h-full w-[28rem] shrink-0 flex-col justify-between rounded-[2rem] p-8 transition-all duration-300 cursor-pointer',
      'bg-white/40 backdrop-blur-md border border-white/60 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50 hover:-translate-y-1',
      className,
    )}
  >
    <div className='flex items-start gap-4'>
      <div className='relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm'>
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className='h-full w-full object-cover'
        />
      </div>
      <div className='flex-1 mt-1'>
        <div className='flex flex-col'>
          <span className='text-lg font-bold text-slate-900 leading-tight'>
            {testimonial.name}
          </span>
          <span className='text-xs font-medium text-blue-600/80 mt-0.5'>
            {testimonial.handle}
          </span>
        </div>
      </div>
    </div>
    <p className='mt-5 text-sm sm:text-base leading-relaxed text-slate-700 font-medium italic'>
      "{testimonial.description}"
    </p>
  </div>
);

export const AnimatedTestimonials = ({
  data,
  className,
  cardClassName,
}: {
  data: Testimonial[];
  className?: string;
  cardClassName?: string;
}) => (
  <div className={cn('w-full overflow-x-hidden py-4 flex flex-col gap-6', className)}>
    {/* Вшиваем CSS-правила прямо сюда. Это гарантирует 100% работу реверса и паузы */}
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes canopy-horizontal {
        0% { transform: translateX(0); }
        100% { transform: translateX(calc(-100% - var(--gap))); }
      }
      .animate-canopy-horizontal {
        animation: canopy-horizontal var(--duration) linear infinite;
      }
      .direction-reverse {
        animation-direction: reverse;
      }
      .group:hover .pause-on-hover {
        animation-play-state: paused;
      }
    `}} />
    
    {/* Создаем два ряда: первый едет влево (false), второй вправо (true) */}
    {[false, true].map((reverse, index) => (
      <AnimatedCanopy
        key={`Canopy-${index}`}
        reverse={reverse}
        className={cn(
          // Делаем разные скорости для первого и второго ряда, чтобы не было синхронности
          index === 0 ? '[--duration:55s]' : '[--duration:60s]'
        )}
        pauseOnHover={true}
        repeat={6}
      >
        {/* Если ряд реверсивный, то и карточки в нем меняем местами */}
        {(reverse ? [...data].reverse() : data).map((testimonial, idx) => (
          <TestimonialCard
            key={`testimonial-${index}-${idx}`}
            testimonial={testimonial}
            className={cardClassName}
          />
        ))}
      </AnimatedCanopy>
    ))}
  </div>
);