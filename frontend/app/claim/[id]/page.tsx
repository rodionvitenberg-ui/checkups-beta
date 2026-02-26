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
        if (!email || !phone) {
            toast({ title: "Ошибка", description: "Заполните все поля", variant: "destructive" });
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
        // ПРАВИЛО 1: Убрали bg-slate-50, добавили relative и поменяли div на main
        <main className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-4">
            
            {/* ПРАВИЛО 2: Вызываем фон (путь от папки public) */}
            <StaticBackground imageUrl="/background/claim.png" />

            {status === 'loading' ? (
                /* --- ЭКРАН ЛОАДЕРА --- */
                /* ПРАВИЛО 3: relative z-10 + стекло (bg-white/80 backdrop-blur-md border-white/40) */
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
                /* ПРАВИЛО 3: relative z-10 + стекло */
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
                                <input 
                                    required type="tel" placeholder="+7 (999) 000-00-00" 
                                    value={phone} onChange={e => setPhone(e.target.value)}
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