'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAnalysisResult, claimRequest } from '@/lib/api';
import { BrainCircuit, CheckCircle2, Mail, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// Импортируем наш универсальный фон
import StaticBackground from '@/components/background/StaticBackground';

export default function ClaimPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;

    const [status, setStatus] = useState<'loading' | 'form'>('loading');
    
    // Состояния лоадера
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState("Подготовка к анализу...");

    // Состояния формы
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- УМНАЯ МАСКА ДЛЯ ТЕЛЕФОНА (СНГ) ---
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Очищаем строку от всего, кроме цифр
        let input = e.target.value.replace(/\D/g, '');

        if (!input) {
            setPhone('');
            return;
        }

        // Если пользователь начинает ввод с 8 (как привыкли в РФ/КЗ), меняем на 7
        if (input[0] === '8') input = '7' + input.slice(1);
        
        // Если первая цифра не из разрешенных кодов стран (7, 3, 9), жестко ставим 7 (РФ/КЗ по умолчанию)
        if (!['7', '3', '9'].includes(input[0])) {
            input = '7' + input;
        }

        let formatted = '+';

        // Применяем разные маски в зависимости от кода страны
        if (input.startsWith('7')) {
            // Россия / Казахстан (+7)
            formatted += '7';
            if (input.length > 1) formatted += ` (${input.substring(1, 4)}`;
            if (input.length > 4) formatted += `) ${input.substring(4, 7)}`;
            if (input.length > 7) formatted += `-${input.substring(7, 9)}`;
            if (input.length > 9) formatted += `-${input.substring(9, 11)}`;
        } else if (input.startsWith('375')) {
            // Беларусь (+375)
            formatted += '375';
            if (input.length > 3) formatted += ` (${input.substring(3, 5)}`;
            if (input.length > 5) formatted += `) ${input.substring(5, 8)}`;
            if (input.length > 8) formatted += `-${input.substring(8, 10)}`;
            if (input.length > 10) formatted += `-${input.substring(10, 12)}`;
        } else if (input.startsWith('996')) {
            // Кыргызстан (+996)
            formatted += '996';
            if (input.length > 3) formatted += ` (${input.substring(3, 6)}`;
            if (input.length > 6) formatted += `) ${input.substring(6, 9)}`;
            if (input.length > 9) formatted += `-${input.substring(9, 12)}`;
        } else if (input.startsWith('998')) {
            // Узбекистан (+998)
            formatted += '998';
            if (input.length > 3) formatted += ` (${input.substring(3, 5)}`;
            if (input.length > 5) formatted += `) ${input.substring(5, 8)}`;
            if (input.length > 8) formatted += `-${input.substring(8, 10)}`;
            if (input.length > 10) formatted += `-${input.substring(10, 12)}`;
        } else {
            // Позволяем вводить код, если он еще не совпал полностью (например, ввели только '37')
            formatted += input.substring(0, 3);
        }

        setPhone(formatted);
    };

    // 1. Поллинг и анимация прогресс-бара
    useEffect(() => {
        if (status !== 'loading') return;

        let isFinished = false;
        const texts = [
            "Распознавание документа...",
            "Извлечение медицинских показателей...",
            "Анализ полученных данных...",
            "Поиск возможных причин...",
            "Формируются выводы и рекомендации...",
            "Почти готово..."
        ];

        let currentProgress = 0;
        const progressInterval = setInterval(() => {
            if (isFinished) return;
            currentProgress += Math.floor(Math.random() * 4) + 2; 
            if (currentProgress > 98) currentProgress = 98; 
            setProgress(currentProgress);

            if (currentProgress < 20) setLoadingText(texts[0]);
            else if (currentProgress < 40) setLoadingText(texts[1]);
            else if (currentProgress < 60) setLoadingText(texts[2]);
            else if (currentProgress < 80) setLoadingText(texts[3]);
            else if (currentProgress < 90) setLoadingText(texts[4]);
            else setLoadingText(texts[5]);
        }, 1500);

        const fetchStatus = async () => {
            try {
                const result = await getAnalysisResult(id);
                if (result.status === 'completed' || result.status === 'failed') {
                    isFinished = true;
                    setProgress(100);
                    setLoadingText("Готово!");
                    clearInterval(progressInterval);
                    clearInterval(pollingInterval);

                    // Ждем секунду на 100% для красоты, затем показываем форму
                    setTimeout(() => {
                        setStatus('form');
                    }, 1000);
                }
            } catch (error) { console.error(error); }
        };

        const pollingInterval = setInterval(fetchStatus, 3000);
        return () => { clearInterval(progressInterval); clearInterval(pollingInterval); };
    }, [id, status]);

    // 2. Отправка формы и переход к результату
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Валидация длины телефона (минимум 11 цифр для всех наших стран)
        const phoneDigits = phone.replace(/\D/g, '');
        
        if (!email || phoneDigits.length < 11) {
            toast({ title: "Ошибка", description: "Введите корректный email и номер телефона полностью", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await claimRequest(id, email, phone);
            // Бэкенд создал юзера и выслал пароль. Просто пускаем на страницу анализа!
            router.push(`/analysis/${id}`);
        } catch (error: any) {
            console.error(error);
            // Если email уже есть в базе, пускаем все равно (бэкенд должен обработать это корректно)
            router.push(`/analysis/${id}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-4">
            
            <StaticBackground imageUrl="/background/claim.png" />

            {status === 'loading' ? (
                /* --- ЭКРАН ЛОАДЕРА --- */
                <div className="relative z-10 bg-white/80 backdrop-blur-md border border-white/40 rounded-3xl shadow-xl shadow-slate-200/20 p-8 sm:p-12 flex flex-col items-center max-w-md w-full animate-in zoom-in-95 duration-500">
                    <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r={60} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100/50" />
                            <circle 
                                cx="80" cy="80" r={60} stroke="currentColor" strokeWidth="12" fill="transparent"
                                className="text-[#00be64] transition-all duration-500 ease-out"
                                strokeDasharray={2 * Math.PI * 60}
                                strokeDashoffset={(2 * Math.PI * 60) - (progress / 100) * (2 * Math.PI * 60)}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-4xl font-extrabold text-slate-800">{progress}%</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <BrainCircuit className="w-5 h-5 text-[#3f94ca] animate-pulse" />
                        <h3 className="text-lg font-bold text-slate-900 text-center">ИИ работает</h3>
                    </div>
                    <p className="text-slate-500 text-center font-medium h-6 transition-all duration-300">
                        {loadingText}
                    </p>
                </div>
            ) : (
                /* --- ЭКРАН ФОРМЫ --- */
                <div className="relative z-10 bg-transparent backdrop-blur-md rounded-3xl shadow-xl transition-shadow p-6 sm:p-10 overflow-hidden max-w-xl w-full animate-in fade-in zoom-in-95 duration-500">
                    <div className="absolute top-0 right-0 w-40 h-40 g-[#0b0be64]/10 ounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    
                    <div className="relative z-10 text-center mb-8">
                        <div className="w-16 h-16 bg-[#00be64]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 border border-[#00be64]/20">
                            <CheckCircle2 className="w-8 h-8 text-[#00be64]" />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Анализ завершен!</h3>
                        <p className="text-slate-700 text-sm sm:text-base leading-relaxed text-left transparent backdrop-blur-sm p-4 rounded-2xl shadow-md transition-shadow">
                            Ваши медицинские анализы успешно расшифрованы. Для получения результата, пожалуйста, укажите вашу электронную почту и телефон. Это нужно для того, чтобы мы автоматически создали для вас личный кабинет (на почту придет логин и пароль) и в дальнейшем вы сможете хранить все анализы в одном месте и сравнивать их друг с другом.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email адрес <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    required type="email" placeholder="ваш@email.com" 
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-transparent backdrop-blur-md shadow-md transition-shadow rounded-xl focus:ring-2 focus:ring-[#00be64]/20 focus:border-accent outline-none transition-all font-medium placeholder:text-slate-400" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Номер телефона <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                {/* ИЗМЕНЕНИЕ: Подключили handlePhoneChange к onChange */}
                                <input 
                                    required type="tel" placeholder="+7 (999) 000-00-00" 
                                    value={phone} onChange={handlePhoneChange}
                                    className="w-full pl-12 pr-4 py-3 backdrop-blur-md shadow-md transition-shadow rounded-xl focus:ring-2 focus:ring-[#00be64]/20 focus:border-accent outline-none transition-all font-medium placeholder:text-slate-400" 
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting || !email || !phone}
                            className="w-full group flex items-center justify-center gap-2 bg-secondary text-white px-6 py-4 rounded-xl hover:bg-accent disabled:bg-slate-300 disabled:cursor-not-allowed transition-all font-bold text-lg mt-6 shadow-lg shadow-[#3f94ca]/30"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>Получить результат <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>
                    </form>
                </div>
            )}

        </main>
    );
}