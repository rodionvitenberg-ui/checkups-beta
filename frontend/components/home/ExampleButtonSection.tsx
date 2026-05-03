import { Link } from '@/i18n/routing'; // ВАЖНО: используем локализованный Link!
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { MorphyButton } from "@/components/ui/morphy-button";
import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';

export function ExampleButtonSection() {
  const t = useTranslations('ExampleButton');

  return (
    <section className="mb-24 relative px-4">
      <Link 
        href="/example-analysis"
        className="block w-full max-w-2xl mx-auto"
      >
        <div className="md:hidden">
          <MorphyButton className="w-full py-8 text-white text-md tracking-tight shadow-lg">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span>{t('title')}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
              <span className="text-[10px] opacity-80 font-sm normal-case">
                {t('subtitleMobile')}
              </span>
            </div>
          </MorphyButton>
        </div>

        <div className="hidden md:block group relative transition-all duration-500">
          <div className={clsx(
            "relative w-full aspect-[672/128] transition-all duration-500",
            "drop-shadow-[0_10px_15px_rgba(226,232,240,0.8)] group-hover:drop-shadow-[0_20px_25px_rgba(191,219,254,0.8)]",
            "transform-gpu group-hover:-translate-y-1.5 will-change-transform"
          )}>
              <Image 
                  src="/buttons/bigbutton.png" 
                  alt={t('altText')} 
                  fill
                  className="object-contain"
                  priority
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 z-10">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-bold text-accent uppercase tracking-tight">
                      {t('title')}
                  </span>
                  <ArrowRight className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform duration-300 transform-gpu" />
                </div>
                <p className="text-accent text-sm font-medium mt-0.5 opacity-90">
                  {t('subtitleDesktop')}
                </p>
              </div>
          </div>
        </div>
      </Link>
    </section>
  );
}