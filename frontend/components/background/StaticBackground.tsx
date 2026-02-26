import Image from 'next/image';

interface StaticBackgroundProps {
  imageUrl: string;
  alt?: string;
}

export default function StaticBackground({ imageUrl, alt = "Background" }: StaticBackgroundProps) {
  return (
    // fixed inset-0 растягивает контейнер на весь экран
    // z-[-1] прячет его под весь остальной контент
    <div className="fixed inset-0 z-[-1] w-full h-full bg-slate-50 pointer-events-none">
      <Image
        src={imageUrl}
        alt={alt}
        fill
        priority // Загружаем картинку в первую очередь, чтобы фон не "моргал"
        quality={100} // Так как у нас хорошие PNG, просим Next.js не шакалить качество
        className="object-cover object-center" 
        sizes="100vw"
      />
    </div>
  );
}