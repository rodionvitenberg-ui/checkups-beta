'use client';

import { HelpCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { getFaqs } from '@/lib/api';

// Получаем адрес бэкенда (убираем /api на конце, чтобы получить чистый корень для /media)
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace('/api', '');

export default function FAQPage() {
    const { data: faqData = [], isLoading } = useQuery({
        queryKey: ['faqs'],
        queryFn: getFaqs
    });

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="max-w-6xl mx-auto">
                
                {/* ШАПКА СТРАНИЦЫ */}
                <div className="text-center mb-16 md:mb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                        <HelpCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                        Часто задаваемые вопросы
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Узнайте, как работает наш сервис, как мы защищаем ваши данные и чем мы можем помочь вашему здоровью.
                    </p>
                </div>

                {/* КОНТЕНТ ИЛИ ЛОАДЕР */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
                        <p>Загружаем ответы...</p>
                    </div>
                ) : faqData.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">
                        Пока здесь нет вопросов. Загляните позже!
                    </div>
                ) : (
                    <div className="space-y-20 md:space-y-32">
                        {faqData.map((item, index) => {
                            const isEven = index % 2 === 0;

                            return (
                                <div 
                                    key={item.id} 
                                    className={clsx(
                                        "flex flex-col gap-8 md:gap-16 items-center group",
                                        !isEven ? "md:flex-row-reverse" : "md:flex-row"
                                    )}
                                >
                                    {/* ТЕКСТОВАЯ ЧАСТЬ */}
                                    <div className="w-full md:w-1/2 space-y-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-2">
                                            Вопрос {index + 1}
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                                            {item.question}
                                        </h2>
                                        <p className="text-slate-600 text-lg leading-relaxed pt-2">
                                            {item.answer}
                                        </p>
                                    </div>

                                    {/* ЧАСТЬ ДЛЯ КАРТИНКИ */}
                                    <div className="w-full md:w-1/2">
                                        <div className="relative aspect-video sm:aspect-[4/3] rounded-3xl bg-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-slate-400 transition-colors duration-300 shadow-sm overflow-hidden">
                                            
                                            {/* ЕСЛИ ИЗОБРАЖЕНИЕ ЕСТЬ - ПОКАЗЫВАЕМ ЕГО */}
                                            {item.image ? (
                                                <img 
                                                    src={`${BACKEND_URL}${item.image}`} 
                                                    alt={item.question} 
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                                />
                                            ) : (
                                                <>
                                                    {/* ИНАЧЕ - ПОКАЗЫВАЕМ СЕРЫЙ ПЛЕЙСХОЛДЕР */}
                                                    <ImageIcon className="w-12 h-12 mb-3 opacity-50 group-hover:scale-110 transition-transform duration-300" />
                                                    <span className="text-sm font-medium">Место для изображения {index + 1}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}