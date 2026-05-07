'use client';

import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { clsx } from 'clsx';

export default function ConsentBanner() {
    const t = useTranslations('Consent');
    const [isVisible, setIsVisible] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        // Проверяем, давал ли юзер ответ ранее
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Небольшая задержка перед появлением для плавности
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleConsent = (value: 'accepted' | 'declined') => {
        localStorage.setItem('cookie-consent', value);
        setIsFadingOut(true);
        // Ждем окончания анимации перед полным удалением из DOM
        setTimeout(() => setIsVisible(false), 300);
    };

    if (!isVisible) return null;

    return (
        <div 
            className={clsx(
                "fixed bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-auto md:w-[400px] z-[100]",
                "bg-white/90 backdrop-blur-xl border border-accent/20 rounded-2xl shadow-2xl p-6",
                "transition-all duration-300 ease-in-out",
                isFadingOut ? "opacity-0 translate-y-4" : "animate-in slide-in-from-bottom-8 fade-in opacity-100"
            )}
        >
            <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center shrink-0 border border-secondary/20">
                    <Shield className="w-5 h-5 text-card" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-accent mb-1">{t('title')}</h3>
                    <p className="text-xs text-accent/70 leading-relaxed">
                        {t('description')}{' '}
                        <Link href="/legal" className="text-secondary hover:text-card font-semibold transition-colors underline decoration-secondary/30 underline-offset-2">
                            {t('privacyLink')}
                        </Link>.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button 
                    onClick={() => handleConsent('accepted')}
                    className="flex-1 bg-secondary hover:bg-secondary/90 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
                >
                    {t('accept')}
                </button>
                <button 
                    onClick={() => handleConsent('declined')}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-accent/80 text-sm font-bold py-2.5 px-4 rounded-xl transition-colors"
                >
                    {t('decline')}
                </button>
            </div>
        </div>
    );
}