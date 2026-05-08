'use client';

import { Cookie } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

// Импортируем наши статические компоненты с текстами
import { CookiesRu } from '@/components/legal/CookiesRu';
import { CookiesEn } from '@/components/legal/CookiesEn';
import { CookiesEs } from '@/components/legal/CookiesEs';

export default function CookiesPage() {
    const t = useTranslations('Cookies');
    const locale = useLocale();

    const renderCookies = () => {
        switch (locale) {
            case 'ru': return <CookiesRu />;
            case 'es': return <CookiesEs />;
            case 'en': 
            default: 
                return <CookiesEn />;
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-12 md:py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-12">
                
                {/* ШАПКА ДОКУМЕНТА */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-12 border-b border-slate-100 pb-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                        <Cookie className="w-8 h-8 text-slate-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                            {t('pageTitle')}
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">
                            {t('pageSubtitle')}
                        </p>
                    </div>
                </div>

                {/* КОНТЕНТ */}
                <div className="space-y-6">
                    <div className="prose prose-slate max-w-none prose-p:leading-relaxed text-slate-600">
                        {renderCookies()}
                    </div>
                </div>

            </div>
        </div>
    );
}