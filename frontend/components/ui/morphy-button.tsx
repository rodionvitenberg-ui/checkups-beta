'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const morphyButtonVariants = cva(
  // Увеличили базовый текст с text-sm на text-base
  'group relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-base font-medium transition-all focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 overflow-hidden [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 rounded-full',
  {
    variants: {
      size: {
        // Увеличили высоту и паддинги для всех размеров
        default: 'h-10 px-6 py-2.5',
        sm: 'h-9 px-5 text-sm',
        lg: 'h-12 px-10 text-lg',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

export interface MorphyButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof morphyButtonVariants> {
  asChild?: boolean;
  dotClassName?: string;
  animate?: 'normal' | 'reverse';
}

const MorphyButton = React.forwardRef<HTMLButtonElement, MorphyButtonProps>(
  (
    {
      className,
      size,
      asChild = false,
      children,
      dotClassName,
      animate = 'normal',
      ...props
    },
    ref,
  ) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const Comp = asChild ? Slot : 'button';
    const buttonSize = size || 'default';

    const handleTouchStart = () => {
      setIsHovered(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsHovered(false), 1500);
    };

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    const active = animate === 'reverse' ? !isHovered : isHovered;

    const userHasTextColor = className?.includes('text-');

    return (
      <Comp
        ref={ref}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        className={cn(
          morphyButtonVariants({ size }),
          'transition-colors duration-700 ease-in-out border',
          active ? '' : 'border-transparent',
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            'absolute inset-0 transition-colors duration-700 ease-in-out rounded-[inherit]',
            active ? 'bg-accent dark:bg-zinc-800' : 'bg-accent dark:bg-white',
          )}
        />
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-700 ease-in-out bg-secondary dark:bg-white',
            'w-[200%] h-[200%] -left-full',
            // Чуть-чуть увеличили размеры точек, чтобы они смотрелись гармонично с новым текстом
            buttonSize === 'sm' &&
              (active ? 'w-2.5 h-2.5 left-3' : 'w-[200%] h-[200%] -left-full'),
            buttonSize === 'default' &&
              (active ? 'w-3 h-3 left-4' : 'w-[200%] h-[200%] -left-full'),
            buttonSize === 'lg' &&
              (active ? 'w-3.5 h-3.5 left-4' : 'w-[200%] h-[200%] -left-full'),
            dotClassName,
          )}
        />
        <span
          className={cn(
            'relative z-10 font-bold transition-all duration-700 ease-in-out',
            // Увеличили сдвиг текста (translate-x-2 вместо 1.5) из-за увеличенной точки
            active ? 'translate-x-2' : 'translate-x-0',
            !userHasTextColor &&
              (active
                ? 'text-black dark:text-white'
                : 'text-white dark:text-black'),
          )}
        >
          {children}
        </span>
      </Comp>
    );
  },
);

MorphyButton.displayName = 'MorphyButton';

export { MorphyButton, morphyButtonVariants };