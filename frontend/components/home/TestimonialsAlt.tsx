'use client';

import { useState } from "react";
import { AnimatePresence, motion, Transition } from "framer-motion";
import { clsx } from "clsx";

// Берем моки из твоего файла
const reviews = [
    {
        quote: "Благодаря этому сервису мне не нужно сразу бежать к терапевту. Я получила полную картину по моим анализам, что позволило мне лучше понять состояние моего здоровья.",
        author: {
            name: 'Ирина',
            title: '29 лет, Москва',
            avatarUrl: '/ava1.jpg' 
        }
    },
    {
        quote: "Регулярно делаю чекап. Загрузил несколько своих последних анализов и заметил ухудшение динамики по нескольким показателям. Это помогло вовремя обратиться к врачу.",
        author: {
            name: 'Максим',
            title: '41 год, Новосибирск',
            avatarUrl: '/ava2.jpg'
        }
    },
    {
        quote: "Очень хорошо, что появился такой сервис. Загрузила анализы своего сына, поняла, в чем могут причины постоянных болезней.",
        author: {
            name: 'Светлана',
            title: '23 года, Екатеринбург',
            avatarUrl: '/ava3.jpg'
        }
    },
    {
        quote: "Была постоянная слабость. Сделал анализы и загрузил в сервис. Оказывается причиной слабости и отсутствия энергии было недостаточное количество магния, ферритина и тестостерона. Сервис дал отличные рекомендации. Посоветовался с врачами и своим тренером. Причины подтвердились. Теперь пью БАДы и жизнь наладилась.",
        author: {
            name: 'Константин',
            title: '45 лет, Чита',
            avatarUrl: '/ava4.jpg'
        }
    }
];

const transition: Transition = {
    type: "spring",
    duration: 0.8,
};

export function TestimonialsAlt() {
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

    return (
        <section className="py-16 md:py-24 relative z-10">
            <div className="mx-auto max-w-4xl px-4 md:px-8">
                
                <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-16 tracking-tight">
                    Что говорят пользователи
                </h2>

                <div className="flex flex-col items-center gap-10">
                    <figure className="flex max-w-3xl flex-col gap-10 text-center min-h-[280px] justify-center">
                        <AnimatePresence initial={false} mode="popLayout">
                            
                            {/* ТЕКСТ ОТЗЫВА */}
                            <motion.blockquote
                                key={currentReviewIndex + "-quote"}
                                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                                animate={{
                                    opacity: 1, scale: 1, y: 0,
                                    transition: { ...transition, delay: 0.2 },
                                }}
                                exit={{
                                    opacity: 0, scale: 0.98, y: -20,
                                    transition: { ...transition, delay: 0 },
                                }}
                                className="origin-bottom text-xl md:text-3xl font-medium text-slate-800 leading-relaxed text-balance"
                            >
                                "{reviews[currentReviewIndex].quote}"
                            </motion.blockquote>

                            {/* АВТОР */}
                            <motion.figcaption
                                key={currentReviewIndex + "-author"}
                                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                                animate={{
                                    opacity: 1, scale: 1, y: 0,
                                    transition: { ...transition, delay: 0.3 },
                                }}
                                exit={{
                                    opacity: 0, scale: 0.98, y: -20,
                                    transition,
                                }}
                                className="flex origin-bottom flex-col items-center gap-4 mt-4"
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <img 
                                        src={reviews[currentReviewIndex].author.avatarUrl} 
                                        alt={reviews[currentReviewIndex].author.name} 
                                        className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-[#3f94ca]/20"
                                    />
                                    <div className="flex flex-col gap-1">
                                        <p className="text-lg font-bold text-slate-900">
                                            {reviews[currentReviewIndex].author.name}
                                        </p>
                                        <cite className="text-sm text-slate-500 font-medium not-italic">
                                            {reviews[currentReviewIndex].author.title}
                                        </cite>
                                    </div>
                                </div>
                            </motion.figcaption>
                        </AnimatePresence>
                    </figure>

                    {/* КАСТОМНАЯ ПАГИНАЦИЯ */}
                    <div className="flex items-center gap-3 mt-4">
                        {reviews.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentReviewIndex(index)}
                                className={clsx(
                                    "rounded-full transition-all duration-300",
                                    currentReviewIndex === index 
                                        ? "w-8 h-2.5 bg-[#3f94ca]" 
                                        : "w-2.5 h-2.5 bg-slate-300 hover:bg-[#3f94ca]/50"
                                )}
                                aria-label={`Показать отзыв ${index + 1}`}
                            />
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}