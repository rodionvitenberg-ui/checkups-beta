'use client';

import { AnimatedTestimonials, type Testimonial } from '@/components/ui/animated-testimonials';

// Наши 24 моковых отзыва с реальными лицами с Unsplash
const defaultTestimonials: Testimonial[] = [
    {
        name: "Анна С.",
        handle: "@anna_s",
        description: "Datadoctor помог мне наконец-то разобраться в своих анализах. ИИ-расшифровка написана простым и понятным языком. Теперь я не паникую при виде красных значений!",
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
        description: "Мне понравилось, как Datadoctor выделяет отклонения от нормы и объясняет возможные причины. Сразу понятно, на что обратить внимание.",
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
        description: "Я нутрициолог, и часто прошу клиентов прогонять свои анализы через Datadoctor до нашей консультации. Это невероятно ускоряет сбор анамнеза!",
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
        description: "Переживала за печеночные пробы мужа. Datadoctor не только подсветил красным критические значения, но и успокоил, объяснив вероятные причины.",
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
        description: "Понятный интерфейс, ничего лишнего. Загрузил фотку бланка — получил результат. Даже моя мама легко разобралась, как пользоваться Datadoctor.",
        image: "https://images.unsplash.com/photo-1508214751196-bfd14332e35b?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Виктор Б.",
        handle: "@victor_b",
        description: "Единственный сервис, который нормально распознал старый помятый бланк из государственной клиники. Идеально!",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150"
    },
    // ---- НОВЫЕ ОТЗЫВЫ ----
    {
        name: "Игорь Д.",
        handle: "@igor_d",
        description: "Datadoctor сэкономил мне кучу нервов. Быстро перевел медицинский язык на человеческий, и я перестал накручивать себя раньше времени.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Татьяна В.",
        handle: "@tanya_v",
        description: "Отличный помощник! Использовала Datadoctor для расшифровки анализов перед операцией. Врачи даже удивились, насколько я была в курсе своих показателей.",
        image: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Сергей М.",
        handle: "@sergey_m",
        description: "Очень круто! Datadoctor не просто показывает нормы, но и учитывает мой возраст и пол при анализе. Персонализация на высшем уровне.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Алина К.",
        handle: "@alina_k",
        description: "В восторге от сервиса. Datadoctor посоветовал обратить внимание на витамин D по косвенным признакам, и после сдачи он действительно оказался в дефиците.",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Максим П.",
        handle: "@maxim_p",
        description: "Datadoctor — мастхэв для всех биохакеров и тех, кто следит за биомаркерами. Аналитика работает быстрее любой регистратуры.",
        image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Юлия С.",
        handle: "@yulia_s",
        description: "Быстро, четко, без лишней воды. Datadoctor заменил мне часы тревожного гугления симптомов и диагнозов.",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Андрей Т.",
        handle: "@andrey_t",
        description: "Интерфейс супер: загрузил фото, попил кофе — получил раскладку. Datadoctor определенно лучший на рынке сейчас.",
        image: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Валерия Н.",
        handle: "@lera_n",
        description: "Пользуюсь Datadoctor каждый раз после сдачи крови. Помогает задавать правильные и предметные вопросы моему лечащему врачу.",
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Константин Л.",
        handle: "@kostya_l",
        description: "ИИ в медицине — это наше будущее. Datadoctor отлично справляется с базовой аналитикой и экономит кучу времени.",
        image: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
        name: "Дарья Ф.",
        handle: "@dasha_f",
        description: "Огромное спасибо команде Datadoctor! Очень полезный, современный и интуитивно понятный инструмент.",
        image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=150&h=150"
    }
];

export function AnimatedTestimonialsSection() {
    return (
        <section className="py-16 relative">
            <div className="max-w-full mx-auto text-center overflow-x-hidden py-4">
                <h2 className="text-3xl md:text-4xl font-bold text-secondary uppercase tracking-tighter mb-12 px-4">
                    Что говорят пользователи
                </h2>
                
                <AnimatedTestimonials data={defaultTestimonials} />
            </div>
        </section>
    );
}