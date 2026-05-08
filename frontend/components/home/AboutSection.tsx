'use client';

import { useTranslations } from 'next-intl';
import { Coffee, ShieldCheck, Cpu } from 'lucide-react';

export function AboutSection() {
  const t = useTranslations('About');

  return (
    <section className="mb-24 py-12 px-6 bg-white/40 backdrop-blur-md border border-white/60 rounded-[2.5rem] shadow-xl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Cpu className="w-8 h-8 text-secondary" />
          <h2 className="text-3xl font-bold text-accent tracking-tight">{t('title')}</h2>
        </div>
        
        <p className="text-lg text-accent/80 leading-relaxed mb-10">
          {t('description')}
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="p-6 bg-secondary/10 rounded-3xl border border-secondary/20">
            <div className="flex items-center gap-2 mb-3 text-card font-bold">
              <ShieldCheck className="w-5 h-5" />
              {t('techTitle')}
            </div>
            <p className="text-sm text-accent/70 leading-relaxed">
              {t('techDescription')}
            </p>
          </div>

          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col justify-between">
            <p className="text-sm text-amber-900/70 font-medium mb-4">
              {t('supportText')}
            </p>
            {/* Здесь твоя ссылка на оплату/поддержку */}
            <a 
              href="https://your-payment-link.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-md hover:shadow-amber-200"
            >
              <Coffee className="w-5 h-5" />
              {t('supportButton')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}