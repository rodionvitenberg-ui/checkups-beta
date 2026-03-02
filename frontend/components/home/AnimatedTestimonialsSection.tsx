'use client';

import { AnimatedTestimonials, Testimonial } from '@/components/ui/animated-testimonials';

// Функция генерации заглушки-аватарки
const generateAvatar = (name: string) => {
  const letter = name.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#3b82f6"/><text x="50" y="54" font-family="system-ui, sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>`;
  return `data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(svg))) : ''}`;
};

// Наши 4 моковых отзыва
const defaultTestimonials: Testimonial[] = [
    {
        name: "Анна С.",
        handle: "@anna_s",
        description: "Checkups помог мне наконец-то разобраться в своих анализах. ИИ-расшифровка написана простым и понятным языком. Теперь я не паникую при виде красных значений!",
        image: generateAvatar("Анна С.")
    },
    {
        name: "Михаил В.",
        handle: "@mikhail_v",
        description: "Очень удобный сервис! Загрузил PDF с результатами, и через пару секунд получил подробный отчет с рекомендациями. Экономит кучу времени перед походом к врачу.",
        image: generateAvatar("Михаил В.")
    },
    {
        name: "Елена П.",
        handle: "@elena_p",
        description: "Мне понравилось, как система выделяет отклонения от нормы и объясняет возможные причины. Сразу понятно, на что обратить внимание.",
        image: generateAvatar("Елена П.")
    },
    {
        name: "Дмитрий К.",
        handle: "@dmitry_k",
        description: "Отличный инструмент для контроля здоровья. Особенно радует, что можно вести историю анализов в личном кабинете и отслеживать динамику.",
        image: generateAvatar("Дмитрий К.")
    }
];

export function AnimatedTestimonialsSection() {
    return (
        <section className="py-16 relative">
            <div className="max-w-full mx-auto text-center overflow-hidden">
                <h2 className="text-3xl font-bold text-slate-900 mb-12 px-4">
                    Что говорят пользователи
                </h2>
                
                {/* Отправляем моковые данные. 
                  Позже, если понадобится, сюда легко можно прикрутить useQuery для загрузки из БД.
                */}
                <AnimatedTestimonials data={defaultTestimonials} />
            </div>
        </section>
    );
}