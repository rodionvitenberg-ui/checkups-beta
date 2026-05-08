'use client';

import Image from 'next/image';

interface StaticBackgroundProps {
  imageUrl: string;
}

export default function StaticBackground({ imageUrl }: StaticBackgroundProps) {
  return (
    // Используем fixed, чтобы фон не «прыгал» при изменении высоты вьюпорта на мобилках
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <Image
        src={imageUrl}
        alt="Background"
        fill
        priority
        // object-cover гарантирует, что картинка не будет сжиматься/растягиваться
        // object-center центрирует её
        className="object-cover object-center sm:object-top"
        sizes="100vw"
        quality={90}
      />
      {/* Легкое наложение, чтобы текст лучше читался */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
    </div>
  );
}