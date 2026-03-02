import React from 'react';
import { cn } from '@/lib/utils';

export interface Testimonial {
  name: string;
  image: string;
  description: string;
  handle: string;
}

interface AnimatedCanopyProps extends React.HTMLAttributes<HTMLDivElement> {
  vertical?: boolean;
  repeat?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  applyMask?: boolean;
}

const AnimatedCanopy = ({
  children,
  vertical = false,
  repeat = 4,
  pauseOnHover = false,
  reverse = false,
  className,
  applyMask = true,
  ...props
}: AnimatedCanopyProps) => (
  <div
    {...props}
    className={cn(
      'group relative flex h-full w-full overflow-hidden p-4 [--duration:30s] [--gap:24px] gap-[var(--gap)]', // Немного увеличил отступы и замедлил скорость
      vertical ? 'flex-col' : 'flex-row',
      className,
    )}
  >
    {Array.from({ length: repeat }).map((_, index) => (
      <div
        key={`item-${index}`}
        className={cn('flex shrink-0 gap-[var(--gap)]', {
          'group-hover:[animation-play-state:paused]': pauseOnHover,
          '[animation-direction:reverse]': reverse,
          'animate-canopy-horizontal flex-row': !vertical,
          'animate-canopy-vertical flex-col': vertical,
        })}
      >
        {children}
      </div>
    ))}
    {applyMask && (
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-10',
          vertical
            ? 'bg-gradient-to-b from-background via-transparent to-background'
            : 'bg-gradient-to-r from-background via-transparent to-background',
        )}
      />
    )}
  </div>
);

const TestimonialCard = ({
  testimonial,
  className,
}: {
  testimonial: Testimonial;
  className?: string;
}) => (
  // --- ИЗМЕНЕНИЯ ЗДЕСЬ: Убрали белый фон, добавили стекло, тени и скругление ---
  <div
    className={cn(
      'flex h-full w-[28rem] shrink-0 flex-col justify-between rounded-[2rem] p-8 transition-all duration-300',
      'bg-white/40 backdrop-blur-md border border-white/60 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50 hover:-translate-y-1',
      className,
    )}
  >
    <div className='flex items-start gap-4'>
      {/* Аватарка */}
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
  <div className={cn('w-full overflow-x-hidden py-4', className)}>
    {/* Добавил инлайн-стили для анимации, чтобы не пришлось лезть в tailwind.config */}
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes canopy-horizontal {
        0% { transform: translateX(0); }
        100% { transform: translateX(calc(-100% - var(--gap))); }
      }
      .animate-canopy-horizontal {
        animation: canopy-horizontal var(--duration) linear infinite;
      }
    `}} />
    
    {/* Две линии: одна едет влево, другая вправо */}
    {[false, true].map((reverse, index) => (
      <AnimatedCanopy
        key={`Canopy-${index}`}
        reverse={reverse}
        className='[--duration:40s]' // Скорость прокрутки
        pauseOnHover
        applyMask={false} // Отключили градиентные маски по бокам, так как фон прозрачный
        repeat={4}
      >
        {data.map((testimonial, idx) => (
          <TestimonialCard
            key={`testimonial-${idx}`}
            testimonial={testimonial}
            className={cardClassName}
          />
        ))}
      </AnimatedCanopy>
    ))}
  </div>
);