import { Link } from '@/i18n/routing'; // Меняем импорт Link на локализованный
import Image from "next/image";
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('Footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full backdrop-blur-md mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
          
          {/* Левая часть: Логотип и копирайт */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image 
                src="/logo.png" 
                alt={t('logoAlt')} 
                width={140} 
                height={40} 
                className="h-10 w-auto object-contain" 
                unoptimized
              />
            </Link>
            <p className="text-sm text-accent">
              {/* Передаем текущий год как переменную в JSON */}
              {t('copyright', { year: currentYear })}
            </p>
          </div>

          {/* Правая часть: Ссылки */}
          <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm font-bold text-secondary tracking-wide">
            <Link href="/" className="hover:text-accent transition-colors uppercase">
              {t('about')}
            </Link>
            
            <Link href="/legal" className="hover:text-accent transition-colors uppercase">
              {t('legal')}
            </Link>
          </div>

        </div>
      </div>
    </footer>
  );
}