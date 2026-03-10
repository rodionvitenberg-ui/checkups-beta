'use client';

import { AnimatedTestimonials, type Testimonial } from '@/components/ui/animated-testimonials';

// Функция генерации заглушки-аватарки
const generateAvatar = (name: string) => {
  const letter = name.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#106bfe"/><text x="50" y="54" font-family="system-ui, sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>`;
  return `data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(svg))) : ''}`;
};

// Наши 4 моковых отзыва
const defaultTestimonials: Testimonial[] = [
    {
        name: "Анна С.",
        handle: "@anna_s",
        description: "Checkups помог мне наконец-то разобраться в своих анализах. ИИ-расшифровка написана простым и понятным языком. Теперь я не паникую при виде красных значений!",
        // ПРИМЕР: Когда загрузишь фото в public/avatars/, замени вызов функции на путь:
        // image: "/avatars/anna.jpg"
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
    },
    {
        name: "Ольга Т.",
        handle: "@olya_fit",
        description: "Я нутрициолог, и часто прошу клиентов прогонять свои анализы через этот сервис до нашей консультации. Это невероятно ускоряет сбор анамнеза!",
        image: generateAvatar("Ольга Т.")
    },
    {
        name: "Иван Г.",
        handle: "@ivan_g",
        description: "Больше не нужно гуглить каждый непонятный медицинский термин из бланка лаборатории. Система все раскладывает по полочкам.",
        image: generateAvatar("Иван Г.")
    },
    {
        name: "Светлана М.",
        handle: "@sveta_med",
        description: "Случайно обнаружила скрытый дефицит железа благодаря рекомендациям ИИ, хотя терапевт в поликлинике сказал, что гемоглобин в норме. Спасибо!",
        image: generateAvatar("Светлана М.")
    },
    {
        name: "Алексей Н.",
        handle: "@alexey_n",
        description: "Удобно, что можно скачать красивый PDF-отчет и просто отправить его своему лечащему врачу в мессенджер. Очень профессионально выглядит.",
        image: generateAvatar("Алексей Н.")
    },
    {
        name: "Екатерина В.",
        handle: "@katya_v",
        description: "Переживала за печеночные пробы мужа. Сервис не только подсветил красным критические значения, но и успокоил, объяснив вероятные причины.",
        image: generateAvatar("Екатерина В.")
    },
    {
        name: "Роман С.",
        handle: "@roman_s",
        description: "Дизайн кабинета просто космос! Все работает быстро, плавно, на мобилке смотреть одно удовольствие. Разработчикам респект.",
        image: generateAvatar("Роман С.")
    },
    {
        name: "Мария К.",
        handle: "@masha_k",
        description: "Загружаю сюда анализы всей семьи. Очень круто, что можно создать отдельные папки-профили для детей и мужа.",
        image: generateAvatar("Мария К.")
    },
    {
        name: "Павел Р.",
        handle: "@pavel_r",
        description: "Был скептично настроен к 'медицинскому ИИ', но расшифровка оказалась пугающе точной. Совпала с диагнозом эндокринолога на 100%.",
        image: generateAvatar("Павел Р.")
    },
    {
        name: "Надежда Л.",
        handle: "@nadya_l",
        description: "Понятный интерфейс, ничего лишнего. Загрузил фотку бланка — получил результат. Даже моя мама легко разобралась, как пользоваться.",
        image: generateAvatar("Надежда Л.")
    },
    {
        name: "Виктор Б.",
        handle: "@victor_b",
        description: "Единственный сервис, который нормально распознал старый помятый бланк из государственной клиники. Идеально!",
        image: generateAvatar("Виктор Б.")
    }
];

export function AnimatedTestimonialsSection() {
    return (
        <section className="py-16 relative">
            {/* ИЗМЕНЕНО: overflow-hidden заменен на overflow-x-hidden, чтобы не резать тени */}
            <div className="max-w-full mx-auto text-center overflow-x-hidden py-4">
                <h2 className="text-3xl font-bold text-slate-900 mb-12 px-4">
                    Что говорят пользователи
                </h2>
                
                {/* Отправляем моковые данные в нашу новую "бегущую строку" */}
                <AnimatedTestimonials data={defaultTestimonials} />
            </div>
        </section>
    );
}