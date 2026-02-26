'use client';

import { useState } from "react";
import { HelpCircle, Loader2, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { getFaqs } from '@/lib/api';
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

// Импортируем наш компонент фона
import StaticBackground from '@/components/background/StaticBackground';

export default function FAQPage() {
    const { data: faqData = [], isLoading } = useQuery({
        queryKey: ['faqs'],
        queryFn: getFaqs
    });

    const [openItems, setOpenItems] = useState<number[]>([]);

    const toggleItem = (id: number) => {
        setOpenItems((prev) => 
            prev.includes(id) 
                ? prev.filter((item) => item !== id) 
                : [...prev, id]
        );
    };

    return (
        // ПРАВИЛО 1: Главный контейнер relative. (Убрали bg-slate-50, чтобы фон было видно)
        <main className="relative min-h-[calc(100vh-64px)] pt-28 pb-16 px-4 sm:px-6 lg:px-8 md:pt-36 md:pb-24 overflow-hidden">
            
            {/* ПРАВИЛО 2: Вставляем фон. Путь указываем от корня public/ */}
            <StaticBackground imageUrl="/background/dashboard.png" />
            
            {/* ПРАВИЛО 3: Оборачиваем весь полезный контент в relative z-10 */}
            <div className="relative z-10 max-w-4xl mx-auto">
                
                {/* ШАПКА СТРАНИЦЫ */}
                <div className="text-center mb-16 md:mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-16 h-16 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-sm border border-white/40">
                        <HelpCircle className="w-8 h-8 text-[#3f94ca]" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 uppercase">
                        Вопросы и Ответы
                    </h1>
                    <p className="text-lg text-slate-700 font-medium max-w-2xl mx-auto drop-shadow-sm">
                        Узнайте, как работает наш сервис, как мы защищаем ваши данные и чем мы можем помочь вашему здоровью.
                    </p>
                </div>

                {/* КОНТЕНТ ИЛИ ЛОАДЕР */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-700 font-medium">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#3f94ca]" />
                        <p>Загружаем ответы...</p>
                    </div>
                ) : faqData.length === 0 ? (
                    <div className="text-center py-20 text-slate-700 font-medium bg-white/60 backdrop-blur-md rounded-3xl border border-white/40">
                        Пока здесь нет вопросов. Загляните позже!
                    </div>
                ) : (
                    <LayoutGroup>
                        <div className="flex flex-col gap-4">
                            {faqData.map((item) => (
                                <FAQItem 
                                    key={item.id} 
                                    item={item} 
                                    isOpen={openItems.includes(item.id)}
                                    toggle={() => toggleItem(item.id)}
                                />
                            ))}
                        </div>
                    </LayoutGroup>
                )}
            </div>
        </main>
    );
}

// Компонент одного вопроса
function FAQItem({ item, isOpen, toggle }: { item: any, isOpen: boolean, toggle: () => void }) {
    return (
        <motion.div 
            layout 
            onClick={toggle}
            className={clsx(
                "group cursor-pointer border rounded-3xl p-6 md:p-8 transition-all duration-300",
                isOpen 
                    ? "bg-transparent backdrop-blur-md border-[#3f94ca]/40 shadow-lg shadow-[#3f94ca]/5" 
                    : "bg-transparent backdrop-blur-md border-white/40 hover:border-[#3f94ca]/40 hover:bg-transparent"
            )}
        >
            <motion.div layout className="flex justify-between items-start gap-4">
                <div className="flex gap-4 md:gap-6 items-start">
                    <h3 className={clsx(
                        "text-lg md:text-xl font-bold leading-tight transition-colors",
                        isOpen ? "text-[#3f94ca]" : "text-slate-900 group-hover:text-[#3f94ca]"
                    )}>
                        {item.question}
                    </h3>
                </div>
                
                <div className={clsx(
                    "shrink-0 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full border transition-all duration-300",
                    isOpen 
                        ? "bg-[#3f94ca] text-white border-[#3f94ca] rotate-45" 
                        : "bg-transparent text-slate-400 border-white/50 group-hover:border-[#3f94ca]/50 group-hover:text-[#3f94ca]"
                )}>
                   <Plus className="w-5 h-5" />
                </div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="pt-6 text-base md:text-lg text-slate-700 font-medium leading-relaxed max-w-3xl">
                            <div dangerouslySetInnerHTML={{ __html: item.answer.replace(/\n/g, '<br/>') }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}