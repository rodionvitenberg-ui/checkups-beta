'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAnalysisResult, claimRequest } from '@/lib/api';
import { BrainCircuit, CheckCircle2, Mail, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

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
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 pt-20 px-4">
            
            {status === 'loading' ? (
                /* --- ЭКРАН ЛОАДЕРА --- */
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 sm:p-12 flex flex-col items-center max-w-md w-full animate-in zoom-in-95 duration-500">
                    <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r={60} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                            <circle 
                                cx="80" cy="80" r={60} stroke="currentColor" strokeWidth="12" fill="transparent"
                                className="text-green-500 transition-all duration-500 ease-out"
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
                        <BrainCircuit className="w-5 h-5 text-blue-500 animate-pulse" />
                        <h3 className="text-lg font-bold text-slate-900 text-center">ИИ работает</h3>
                    </div>
                    <p className="text-slate-500 text-center font-medium h-6 transition-all duration-300">
                        {loadingText}
                    </p>
                </div>
            ) : (
                /* --- ЭКРАН ФОРМЫ --- */
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-blue-900/5 p-6 sm:p-10 relative overflow-hidden max-w-xl w-full animate-in fade-in zoom-in-95 duration-500">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-green-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    
                    <div className="relative z-10 text-center mb-8">
                        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Анализ завершен!</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
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
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-medium" 
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
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-medium" 
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting || !email || !phone}
                            className="w-full group flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-xl hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all font-bold text-lg mt-6 shadow-lg shadow-slate-200"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>Получить результат <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>
                    </form>
                </div>
            )}

        </div>
    );
}