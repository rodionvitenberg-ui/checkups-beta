'use client';

import { AnimatedTestimonials, type Testimonial } from '@/components/ui/animated-testimonials';

// Наши 14 моковых отзывов со сгенерированными аватарками (используем качественные лица с Unsplash)
const defaultTestimonials: Testimonial[] = [
    {
        name: "Анна С.",
        handle: "@anna_s",
        description: "Checkups помог мне наконец-то разобраться в своих анализах. ИИ-расшифровка написана простым и понятным языком. Теперь я не паникую при виде красных значений!",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Михаил В.",
        handle: "@mikhail_v",
        description: "Очень удобный сервис! Загрузил PDF с результатами, и через пару секунд получил подробный отчет с рекомендациями. Экономит кучу времени перед походом к врачу.",
        image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Елена П.",
        handle: "@elena_p",
        description: "Мне понравилось, как система выделяет отклонения от нормы и объясняет возможные причины. Сразу понятно, на что обратить внимание.",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Дмитрий К.",
        handle: "@dmitry_k",
        description: "Отличный инструмент для контроля здоровья. Особенно радует, что можно вести историю анализов в личном кабинете и отслеживать динамику.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Ольга Т.",
        handle: "@olya_fit",
        description: "Я нутрициолог, и часто прошу клиентов прогонять свои анализы через этот сервис до нашей консультации. Это невероятно ускоряет сбор анамнеза!",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Иван Г.",
        handle: "@ivan_g",
        description: "Больше не нужно гуглить каждый непонятный медицинский термин из бланка лаборатории. Система все раскладывает по полочкам.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Светлана М.",
        handle: "@sveta_med",
        description: "Случайно обнаружила скрытый дефицит железа благодаря рекомендациям ИИ, хотя терапевт в поликлинике сказал, что гемоглобин в норме. Спасибо!",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Алексей Н.",
        handle: "@alexey_n",
        description: "Удобно, что можно скачать красивый PDF-отчет и просто отправить его своему лечащему врачу в мессенджер. Очень профессионально выглядит.",
        image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Екатерина В.",
        handle: "@katya_v",
        description: "Переживала за печеночные пробы мужа. Сервис не только подсветил красным критические значения, но и успокоил, объяснив вероятные причины.",
        image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Роман С.",
        handle: "@roman_s",
        description: "Дизайн кабинета просто космос! Все работает быстро, плавно, на мобилке смотреть одно удовольствие. Разработчикам респект.",
        image: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Мария К.",
        handle: "@masha_k",
        description: "Загружаю сюда анализы всей семьи. Очень круто, что можно создать отдельные папки-профили для детей и мужа.",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Павел Р.",
        handle: "@pavel_r",
        description: "Был скептично настроен к 'медицинскому ИИ', но расшифровка оказалась пугающе точной. Совпала с диагнозом эндокринолога на 100%.",
        image: "https://images.unsplash.com/photo-1615109398623-88346a601842?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Надежда Л.",
        handle: "@nadya_l",
        description: "Понятный интерфейс, ничего лишнего. Загрузил фотку бланка — получил результат. Даже моя мама легко разобралась, как пользоваться.",
        image: "https://images.unsplash.com/photo-1508214751196-bfd14332e35b?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Виктор Б.",
        handle: "@victor_b",
        description: "Единственный сервис, который нормально распознал старый помятый бланк из государственной клиники. Идеально!",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150"
    }
];

export function AnimatedTestimonialsSection() {
    return (
        <section className="py-16 relative">
            {/* overflow-hidden заменен на overflow-x-hidden, чтобы не резать тени */}
            <div className="max-w-full mx-auto text-center overflow-x-hidden py-4">
                {/* Подтянули стили заголовка к нашему единому дизайн-коду */}
                <h2 className="text-3xl font-bold text-secondary uppercase tracking-tighter mb-12 px-4">
                    Что говорят пользователи
                </h2>
                
                {/* Отправляем моковые данные в "бегущую строку" */}
                <AnimatedTestimonials data={defaultTestimonials} />
            </div>
        </section>
    );
}