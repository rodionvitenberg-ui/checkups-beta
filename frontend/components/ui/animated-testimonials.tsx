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
      'group relative flex w-full overflow-hidden p-4 gap-[var(--gap)] [--gap:24px]',
      className,
    )}
  >
    {Array.from({ length: repeat }).map((_, index) => (
      <div
        key={`item-${index}`}
        className={cn(
          'flex shrink-0 gap-[var(--gap)] flex-row animate-canopy-horizontal',
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
      // Подложка в стиле остальных блоков (полупрозрачная, с блюром)
      "relative flex h-full w-[22rem] md:w-[28rem] max-w-full flex-col justify-between overflow-hidden rounded-[2rem] border border-white/30 bg-white/15 backdrop-blur-md p-6 md:p-8 shadow-sm transition-all duration-300 hover:bg-white/20 hover:shadow-xl hover:scale-[1.02]",
      className
    )}
  >
    <div className="flex flex-col gap-4">
      {/* Текст отзыва теперь accent (вместо черного) */}
      <p className="text-base md:text-lg text-accent font-medium leading-relaxed opacity-90">
        "{testimonial.description}"
      </p>
    </div>
    <div className="mt-8 flex items-center gap-4">
      {/* Обводка аватарки стала secondary (вместо синей) */}
      <div className="relative h-12 w-12 md:h-14 md:w-14 shrink-0 overflow-hidden rounded-full border-2 border-secondary/50 shadow-sm bg-white/50">
        {/* ИСПОЛЬЗУЕМ ОБЫЧНЫЙ img! Это решит проблему с отображением на проде */}
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col">
        {/* Имя теперь secondary (вместо черного/синего) */}
        <h3 className="text-lg font-bold text-secondary leading-tight">
          {testimonial.name}
        </h3>
        {/* Никнейм теперь accent */}
        <p className="text-sm text-accent font-medium opacity-70">
          {testimonial.handle}
        </p>
      </div>
    </div>
  </div>
);

export const AnimatedTestimonials = ({
  data,
  className,
}: {
  data: Testimonial[];
  className?: string;
}) => (
  <div className={cn('w-full overflow-x-hidden py-4 flex flex-col gap-6', className)}>
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
    
    {[false, true].map((reverse, index) => (
      <AnimatedCanopy
        key={`Canopy-${index}`}
        reverse={reverse}
        className={cn(
          index === 0 ? '[--duration:60s]' : '[--duration:65s]'
        )}
        pauseOnHover={true}
        repeat={6}
      >
        {(reverse ? [...data].reverse() : data).map((testimonial, idx) => (
          <TestimonialCard 
            key={`${testimonial.handle}-${idx}`} 
            testimonial={testimonial} 
          />
        ))}
      </AnimatedCanopy>
    ))}
  </div>
);