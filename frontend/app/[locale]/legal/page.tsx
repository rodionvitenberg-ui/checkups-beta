'use client';

import { Scale } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

// Импортируем наши новые статические компоненты
import { PrivacyPolicyRu } from '@/components/legal/PrivacyPolicyRu';
import { PrivacyPolicyEn } from '@/components/legal/PrivacyPolicyEn';
import { PrivacyPolicyEs } from '@/components/legal/PrivacyPolicyEs';

export default function LegalPage() {
    const t = useTranslations('Legal');
    const locale = useLocale();

    // Функция-помощник для рендера нужного языка политики конфиденциальности
    const renderPrivacyPolicy = () => {
        switch (locale) {
            case 'ru': return <PrivacyPolicyRu />;
            case 'es': return <PrivacyPolicyEs />;
            case 'en': 
            default: 
                return <PrivacyPolicyEn />;
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-12 md:py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-12">
                
                {/* ШАПКА ДОКУМЕНТА */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-12 border-b border-slate-100 pb-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                        <Scale className="w-8 h-8 text-slate-600" />
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

                <div className="space-y-16">
                    {/* ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ */}
                    <section>
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">
                                {t('privacyTitle')}
                            </h2>
                        </div>

                        <div className="prose prose-slate max-w-none prose-p:leading-relaxed text-slate-600">
                            {/* Вызываем функцию, которая отдаст правильный компонент */}
                            {renderPrivacyPolicy()}
                        </div>
                    </section>
                    
                    {/* Место для Пользовательского соглашения (Terms of Service) 
                        Позже сделаем по такой же схеме: TermsRu, TermsEn, TermsEs */}
                </div>

            </div>
        </div>
    );
}