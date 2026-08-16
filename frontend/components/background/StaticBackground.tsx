'use client';

import Image from 'next/image';

interface StaticBackgroundProps {
  imageUrl: string;
}

export default function StaticBackground({ imageUrl }: StaticBackgroundProps) {
  return (
    // Используем fixed, чтобы фон не «прыгал» при изменении высоты вьюпорта на мобилках
    <div className="fixed inset-x-0 top-0 h-dvh z-0 pointer-events-none overflow-hidden">
      <Image
        src={imageUrl}
        alt="Background"
        fill
        priority
        className="object-cover object-center sm:object-top"
        unoptimized
      />
      {/* Легкое наложение, чтобы текст лучше читался */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[0px]" />
    </div>
  );
}