'use client';

import { useStore } from '@/lib/store';
import { createPayment } from '@/lib/api';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function PaywallModal() {
    const { isPaywallOpen, setPaywallOpen } = useStore();
    const [isLoading, setIsLoading] = useState(false);
    
    // Подключаем переводы (потом создашь секцию Paywall в JSON-файлах)
    const t = useTranslations('Paywall'); 

    if (!isPaywallOpen) return null;

    const handleBuy = async () => {
        setIsLoading(true);
        try {
            const data = await createPayment();
            if (data.payment_url) {
                // Перенаправляем пользователя на Cryptomus
                window.location.href = data.payment_url;
            }
        } catch (error) {
            console.error("Payment error:", error);
            alert("Произошла ошибка при создании платежа. Попробуйте позже.");
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
                <button 
                    onClick={() => setPaywallOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
                >
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Лимит исчерпан
                    </h2>
                    <p className="text-gray-600">
                        Вы достигли лимита бесплатных действий. Оформите PRO-доступ за $10/месяц, чтобы продолжить использование сервиса без ограничений.
                    </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <ul className="space-y-3 text-sm text-gray-700">
                        <li className="flex items-center gap-2">
                            <span className="text-green-500 font-bold">✓</span> До 10 анализов в день
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500 font-bold">✓</span> До 50 сообщений в чате
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500 font-bold">✓</span> Расширенные рекомендации
                        </li>
                    </ul>
                </div>

                <button 
                    onClick={handleBuy}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition flex justify-center items-center disabled:opacity-70"
                >
                    {isLoading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                        "Оформить PRO за $10"
                    )}
                </button>
            </div>
        </div>
    );
}