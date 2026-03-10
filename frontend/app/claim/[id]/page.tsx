'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAnalysisResult, claimRequest, claimVerify } from '@/lib/api';
import { BrainCircuit, CheckCircle2, Mail, Phone, ArrowRight, Loader2, KeyRound, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// Импортируем наш универсальный фон
import StaticBackground from '@/components/background/StaticBackground';

export default function ClaimPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    
    // БРОНЕБОЙНЫЙ ПАРСИНГ: Декодируем %2C в запятую и разбиваем на массив ID
    const rawIds = decodeURIComponent(params.id as string);
    const ids = rawIds ? rawIds.split(',').map(id => id.trim()).filter(Boolean) : [];

    // Четыре состояния: 
    // analyzing (крутится большой лоадер для 1-го файла) -> form -> verify -> results (финальное окно со списком)
    const [step, setStep] = useState<'analyzing' | 'form' | 'verify' | 'results'>('analyzing');
    const [isAuth, setIsAuth] = useState(false);
    
    // Храним статусы всех файлов для финального окна
    const [statuses, setStatuses] = useState<Record<string, string>>({});
    
    // Состояния лоадера
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState("Подготовка к анализу...");

    // Состояния формы
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState(''); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Проверяем авторизацию при загрузке
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsAuth(!!localStorage.getItem('token'));
        }
    }, []);

    // --- УМНАЯ МАСКА ДЛЯ ТЕЛЕФОНА (СНГ) ---
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value.replace(/\D/g, '');
        if (!input) { setPhone(''); return; }
        if (input[0] === '8') input = '7' + input.slice(1);
        if (!['7', '3', '9'].includes(input[0])) input = '7' + input;

        let formatted = '+';
        if (input.startsWith('7')) {
            formatted += '7';
            if (input.length > 1) formatted += ` (${input.substring(1, 4)}`;
            if (input.length > 4) formatted += `) ${input.substring(4, 7)}`;
            if (input.length > 7) formatted += `-${input.substring(7, 9)}`;
            if (input.length > 9) formatted += `-${input.substring(9, 11)}`;
        } else if (input.startsWith('375')) {
            formatted += '375';
            if (input.length > 3) formatted += ` (${input.substring(3, 5)}`;
            if (input.length > 5) formatted += `) ${input.substring(5, 8)}`;
            if (input.length > 8) formatted += `-${input.substring(8, 10)}`;
            if (input.length > 10) formatted += `-${input.substring(10, 12)}`;
        } else if (input.startsWith('996')) {
            formatted += '996';
            if (input.length > 3) formatted += ` (${input.substring(3, 6)}`;
            if (input.length > 6) formatted += `) ${input.substring(6, 9)}`;
            if (input.length > 9) formatted += `-${input.substring(9, 12)}`;
        } else if (input.startsWith('998')) {
            formatted += '998';
            if (input.length > 3) formatted += ` (${input.substring(3, 5)}`;
            if (input.length > 5) formatted += `) ${input.substring(5, 8)}`;
            if (input.length > 8) formatted += `-${input.substring(8, 10)}`;
            if (input.length > 10) formatted += `-${input.substring(10, 12)}`;
        } else {
            formatted += input.substring(0, 3);
        }
        setPhone(formatted);
    };

    // 1. ФЕЙКОВЫЙ ПРОГРЕСС-БАР (Работает только на первом шаге)
    useEffect(() => {
        if (step !== 'analyzing') return;

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
        const interval = setInterval(() => {
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

        return () => { isFinished = true; clearInterval(interval); };
    }, [step]);

    // 2. ПОЛЛИНГ ПЕРВОГО ФАЙЛА (Для большого круга)
    useEffect(() => {
        if (step !== 'analyzing' || ids.length === 0) return;

        const pollFirst = async () => {
            try {
                // Опрашиваем ТОЛЬКО первый файл
                const result = await getAnalysisResult(ids[0]);
                setStatuses(prev => ({ ...prev, [ids[0]]: result.status }));

                if (result.status === 'completed' || result.status === 'failed') {
                    setProgress(100);
                    setLoadingText("Готово!");
                    
                    setTimeout(() => {
                        // Если авторизован -> сразу показываем окно всех результатов
                        // Если аноним -> тормозим процесс и просим форму
                        if (isAuth) {
                            setStep('results');
                        } else {
                            setStep('form');
                        }
                    }, 1000);
                }
            } catch (error) { console.error(error); }
        };

        const interval = setInterval(pollFirst, 3000);
        pollFirst(); // первый вызов без задержки
        return () => clearInterval(interval);
    }, [step, ids, isAuth]);

    // 3. ПОЛЛИНГ ВСЕХ ФАЙЛОВ (В финальном окне)
    useEffect(() => {
        if (step !== 'results' || ids.length === 0) return;

        let isPolling = true;

        const pollNext = async () => {
            if (!isPolling) return;
            
            // Используем setStatuses чисто чтобы получить самый свежий state без добавления его в зависимости useEffect
            setStatuses(prevStatuses => {
                // Находим ПЕРВЫЙ файл, который еще не completed и не failed
                const currentId = ids.find(id => prevStatuses[id] !== 'completed' && prevStatuses[id] !== 'failed');
                
                if (currentId) {
                    // Опрашиваем только его!
                    getAnalysisResult(currentId)
                        .then(result => {
                            if (isPolling) {
                                setStatuses(s => ({ ...s, [currentId]: result.status }));
                            }
                        })
                        .catch(console.error);
                }
                
                return prevStatuses;
            });
        };

        const interval = setInterval(pollNext, 3000);
        pollNext(); // первый вызов
        
        return () => {
            isPolling = false;
            clearInterval(interval);
        };
    }, [step, ids]);

    // --- ОБРАБОТЧИКИ ФОРМ ---

    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const phoneDigits = phone.replace(/\D/g, '');
        if (!email || phoneDigits.length < 11) {
            toast({ title: "Ошибка", description: "Введите корректный email и номер телефона", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await claimRequest(ids, email, phone);
            setStep('verify');
            toast({ title: "Код отправлен!", description: "Мы отправили 6-значный код на вашу почту.", variant: "default" });
        } catch (error: any) {
            if (error.response?.status === 403 || error.response?.data?.status === 'requires_password') {
                setStep('verify');
                toast({ title: "С возвращением!", description: "Этот email уже зарегистрирован. Введите пароль.", variant: "default" });
            } else {
                toast({ title: "Ошибка", description: error.response?.data?.message || "Произошла ошибка.", variant: "destructive" });
            }
        } finally { setIsSubmitting(false); }
    };

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;

        setIsSubmitting(true);
        try {
            await claimVerify(ids, email, code, code, phone);
            toast({ title: "Успешно", description: "Кабинет активирован, анализы привязаны", variant: "success" });
            
            // Сохраняем метки NEW
            localStorage.setItem('new_analysis_ids', JSON.stringify(ids));
            setIsAuth(true);
            
            // После проверки ПИН-кода переходим к окну со списком файлов!
            setStep('results');
        } catch (error: any) {
            toast({ title: "Ошибка", description: error.response?.data?.message || "Неверный код", variant: "destructive" });
        } finally { setIsSubmitting(false); }
    };

    const allCompleted = ids.every(id => statuses[id] === 'completed' || statuses[id] === 'failed');

    return (
        <main className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-4">
            
            <StaticBackground imageUrl="/background/claim.png" />

            {step === 'analyzing' && (
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
                        <h3 className="text-lg font-bold text-slate-900 text-center">ИИ анализирует документ</h3>
                    </div>
                    <p className="text-slate-500 text-center font-medium h-6 transition-all duration-300">
                        {loadingText}
                    </p>
                </div>
            )}

            {step === 'form' && (
                <div className="relative z-10 bg-transparent backdrop-blur-md rounded-3xl shadow-xl transition-shadow p-6 sm:p-10 overflow-hidden max-w-xl w-full animate-in fade-in zoom-in-95 duration-500">
                    <div className="relative z-10 text-center mb-8">
                        <div className="w-16 h-16 bg-[#00be64]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 border border-[#00be64]/20">
                            <CheckCircle2 className="w-8 h-8 text-[#00be64]" />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Первый анализ завершен!</h3>
                        <p className="text-slate-700 text-sm sm:text-base leading-relaxed text-left transparent backdrop-blur-sm p-4 rounded-2xl shadow-md transition-shadow">
                            Ваши данные успешно считаны. Укажите вашу почту и телефон. Мы создадим личный кабинет (на почту придет PIN-код) и немедленно продолжим расшифровку оставшихся документов.
                        </p>
                    </div>
                    <form onSubmit={handleRequestSubmit} className="relative z-10 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email адрес <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input required type="email" placeholder="ваш@email.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-transparent backdrop-blur-md shadow-md transition-shadow rounded-xl focus:ring-2 focus:ring-[#00be64]/20 focus:border-accent outline-none transition-all font-medium placeholder:text-slate-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Номер телефона <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input required type="tel" placeholder="+7 (999) 000-00-00" value={phone} onChange={handlePhoneChange} className="w-full pl-12 pr-4 py-3 backdrop-blur-md shadow-md transition-shadow rounded-xl focus:ring-2 focus:ring-[#00be64]/20 focus:border-accent outline-none transition-all font-medium placeholder:text-slate-400" />
                            </div>
                        </div>
                        <button type="submit" disabled={isSubmitting || !email || !phone} className="w-full group flex items-center justify-center gap-2 bg-secondary text-white px-6 py-4 rounded-xl hover:bg-accent disabled:bg-slate-300 disabled:cursor-not-allowed transition-all font-bold text-lg mt-6 shadow-lg shadow-[#3f94ca]/30">
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Продолжить <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                        </button>
                    </form>
                </div>
            )}

            {step === 'verify' && (
                <div className="relative z-10 bg-transparent backdrop-blur-md rounded-3xl shadow-xl transition-shadow p-6 sm:p-10 overflow-hidden max-w-xl w-full animate-in slide-in-from-right-8 fade-in duration-500">
                    <div className="relative z-10 text-center mb-8">
                        <div className="w-16 h-16 bg-[#3f94ca]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#3f94ca]/20">
                            <KeyRound className="w-8 h-8 text-[#3f94ca]" />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Подтверждение</h3>
                        <p className="text-slate-700 text-sm sm:text-base leading-relaxed text-center">
                            На почту <b>{email}</b> отправлен 6-значный PIN-код. <br/>Если вы уже регистрировались ранее, просто введите ваш пароль.
                        </p>
                    </div>
                    <form onSubmit={handleVerifySubmit} className="relative z-10 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Код из письма или пароль</label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input required type="text" placeholder="Введите код или пароль" value={code} onChange={e => setCode(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-transparent backdrop-blur-md shadow-md transition-shadow rounded-xl focus:ring-2 focus:ring-[#3f94ca]/20 focus:border-accent outline-none transition-all font-medium placeholder:text-slate-400" />
                            </div>
                        </div>
                        <button type="submit" disabled={isSubmitting || !code} className="w-full group flex items-center justify-center gap-2 bg-secondary text-white px-6 py-4 rounded-xl hover:bg-accent disabled:bg-slate-300 disabled:cursor-not-allowed transition-all font-bold text-lg mt-6 shadow-lg shadow-[#3f94ca]/30">
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Активировать и продолжить <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                        </button>
                    </form>
                </div>
            )}

            {/* ФИНАЛЬНОЕ ОКНО РЕЗУЛЬТАТОВ */}
            {step === 'results' && (
                <div className="relative z-10 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-xl w-full animate-in zoom-in-95 duration-500 border border-white/60">
                    <div className="text-center mb-8">
                        {allCompleted ? (
                            <img src="/done.png" alt="Готово" className="w-24 h-24 mx-auto mb-4 drop-shadow-md animate-in zoom-in duration-300" />
                        ) : (
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            </div>
                        )}
                        <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                            {allCompleted ? "Все анализы расшифрованы!" : "Расшифровка документов..."}
                        </h3>
                        <p className="text-slate-600 text-sm font-medium px-4">
                            {allCompleted 
                                ? "Результаты готовы. Нажмите на любой документ, чтобы посмотреть детальный отчет ИИ." 
                                : "Пожалуйста, подождите, мы завершаем обработку оставшихся файлов. Вы уже можете открыть готовые результаты."}
                        </p>
                    </div>

                    <div className="space-y-3 mb-8">
                        {ids.map((id, idx) => {
                            const status = statuses[id];
                            const isDone = status === 'completed' || status === 'failed';
                            
                            return (
                                <div key={id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-xl shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-3">
                                        {isDone ? (
                                            <CheckCircle2 className="w-6 h-6 text-[#00be64]" />
                                        ) : (
                                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                        )}
                                        <span className="font-bold text-slate-800">Документ {idx + 1}</span>
                                    </div>
                                    
                                    {isDone ? (
                                        <Link href={`/analysis/${id}`} className="flex items-center gap-1.5 text-sm font-bold bg-white border border-slate-200 px-4 py-2 rounded-lg text-[#3f94ca] hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm">
                                            Смотреть <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-400 bg-slate-200/50 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                            В процессе
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {allCompleted && (
                        <button 
                            onClick={() => router.push('/dashboard')} 
                            className="w-full bg-slate-900 text-white font-bold text-lg py-4 rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
                        >
                            Перейти в Личный Кабинет
                        </button>
                    )}
                </div>
            )}

        </main>
    );
}