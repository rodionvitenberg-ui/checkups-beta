'use client';

import { useStore } from '@/lib/store';
import { createPayment } from '@/lib/api';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Crown, Sparkles, Activity, MessageSquare, ShieldCheck, X, Loader2, Lock } from 'lucide-react';

export default function PaywallModal() {
    const { isPaywallOpen, setPaywallOpen, isPro } = useStore();
    const [isLoading, setIsLoading] = useState(false);
    
    const t = useTranslations('Paywall'); 

    if (!isPaywallOpen || isPro) return null;

    const handleBuy = async () => {
        setIsLoading(true);
        try {
            const data = await createPayment();
            if (data.payment_url) {
                window.location.href = data.payment_url;
            }
        } catch (error) {
            console.error("Payment error:", error);
            alert(t('paymentError', { fallback: "Произошла ошибка при создании платежа. Попробуйте позже." }));
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                
                {/* Декоративный фоновый градиент */}
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-indigo-50 via-blue-50 to-white opacity-80" />
                
                {/* Кнопка закрытия */}
                <button 
                    onClick={() => setPaywallOpen(false)}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors z-20"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="px-8 pt-10 pb-8 relative z-10">
                    {/* Премиальная иконка */}
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-6 rotate-3">
                        <Crown className="w-8 h-8 text-white drop-shadow-sm" />
                    </div>

                    {/* Заголовок */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">
                            {t('title', { fallback: 'Перейдите на PRO' })}
                        </h2>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            {t('subtitle', { fallback: 'Вы достигли лимита бесплатных действий. Откройте полный доступ к ИИ-ассистенту и безлимитной аналитике.' })}
                        </p>
                    </div>

                    {/* Список фичей */}
                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                <Activity className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">{t('feature1Title', { fallback: '10 анализов в день' })}</h4>
                                <p className="text-xs text-slate-500">{t('feature1Desc', { fallback: 'Загружайте бланки для всей семьи' })}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                                <MessageSquare className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">{t('feature2Title', { fallback: 'Безлимитный ИИ-чат' })}</h4>
                                <p className="text-xs text-slate-500">{t('feature2Desc', { fallback: 'До 50 детальных вопросов по каждому бланку' })}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                <Sparkles className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">{t('feature3Title', { fallback: 'Умная аналитика' })}</h4>
                                <p className="text-xs text-slate-500">{t('feature3Desc', { fallback: 'Графики динамики и учет ваших особенностей' })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Кнопка оплаты */}
                    <button 
                        onClick={handleBuy}
                        disabled={isLoading}
                        className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {t('buttonText', { fallback: 'Оформить PRO за $10 / мес' })}
                            </>
                        )}
                    </button>

                    {/* Траст-бейдж */}
                    <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400">
                        <Lock className="w-3 h-3" />
                        {t('securePayment', { fallback: 'Безопасная оплата через Cryptomus' })}
                    </div>
                </div>
            </div>
        </div>
    );
}