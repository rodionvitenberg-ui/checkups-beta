'use client';

import dynamic from 'next/dynamic';

// Динамически импортируем Ballpit, отключая SSR
const Ballpit = dynamic(() => import('@/components/Ballpit'), {
  ssr: false,
});

export default function BallpitBackground() {
  return (
    // fixed inset-0 растягивает контейнер на весь экран
    // z-[-1] убирает его под основной контент
    // pointer-events-none нужен, чтобы канвас не блокировал клики по сайту
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-slate-50">
      <Ballpit
        count={15} // Можно увеличить, если захочется больше деталей
        gravity={0} // Без гравитации они будут плавно парить
        friction={1}
        wallBounce={1}
        followCursor={false}
        // Передаем наши фирменные цвета. 
        // В зависимости от реализации Ballpit, пропс может называться colors или palette.
        colors={['#3f94ca', '#00be64']} 
      />
    </div>
  );
}