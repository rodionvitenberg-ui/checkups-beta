'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/routing';
import { getAnalysisResult, claimRequest, claimVerify } from '@/lib/api';
// Удалили импорт Phone из lucide-react
import { BrainCircuit, CheckCircle2, Mail, ArrowRight, Loader2, KeyRound, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';

import StaticBackground from '@/components/background/StaticBackground';

export default function ClaimPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const t = useTranslations('Claim');
    
    const rawIds = decodeURIComponent(params.id as string);
    const ids = rawIds ? rawIds.split(',').map(id => id.trim()).filter(Boolean) : [];

    const [step, setStep] = useState<'analyzing' | 'form' | 'verify' | 'results'>('analyzing');
    const [isAuth, setIsAuth] = useState(false);
    const [statuses, setStatuses] = useState<Record<string, string>>({});
    
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState(t('defaultLoading'));

    // Удалили стейт телефона
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(''); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsAuth(!!localStorage.getItem('token'));
        }
    }, []);

    // УДАЛЕНА ФУНКЦИЯ handlePhoneChange

    useEffect(() => {
        if (step !== 'analyzing') return;

        let isFinished = false;
        const texts = [
            t('loadingTexts.0'),
            t('loadingTexts.1'),
            t('loadingTexts.2'),
            t('loadingTexts.3'),
            t('loadingTexts.4'),
            t('loadingTexts.5')
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
    }, [step, t]);

    useEffect(() => {
        if (step !== 'analyzing' || ids.length === 0) return;

        const pollFirst = async () => {
            try {
                const result = await getAnalysisResult(ids[0]);
                setStatuses(prev => ({ ...prev, [ids[0]]: result.status }));

                if (result.status === 'completed' || result.status === 'failed') {
                    setProgress(100);
                    setLoadingText(t('loadingDone'));
                    
                    setTimeout(() => {
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
        pollFirst(); 
        return () => clearInterval(interval);
    }, [step, ids, isAuth, t]);

    useEffect(() => {
        if (step !== 'results' || ids.length === 0) return;

        let isPolling = true;

        const pollNext = async () => {
            if (!isPolling) return;
            
            setStatuses(prevStatuses => {
                const currentId = ids.find(id => prevStatuses[id] !== 'completed' && prevStatuses[id] !== 'failed');
                
                if (currentId) {
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
        pollNext(); 
        
        return () => {
            isPolling = false;
            clearInterval(interval);
        };
    }, [step, ids]);

    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Убрали проверку телефона
        if (!email) {
            toast({ title: t('toasts.errorTitle'), description: t('toasts.validationError'), variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            // Убрали передачу телефона
            await claimRequest(ids, email);
            setStep('verify');
            toast({ title: t('toasts.codeSentTitle'), description: t('toasts.codeSentDesc'), variant: "default" });
        } catch (error: any) {
            if (error.response?.status === 403 || error.response?.data?.status === 'requires_password') {
                setStep('verify');
                toast({ title: t('toasts.welcomeBackTitle'), description: t('toasts.welcomeBackDesc'), variant: "default" });
            } else {
                toast({ title: t('toasts.errorTitle'), description: error.response?.data?.message || t('toasts.defaultError'), variant: "destructive" });
            }
        } finally { setIsSubmitting(false); }
    };

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;

        setIsSubmitting(true);
        try {
            // Убрали передачу телефона (теперь передаем только ids, email, code, password)
            await claimVerify(ids, email, code, code);
            toast({ title: t('toasts.successTitle'), description: t('toasts.successDesc'), variant: "success" });
            
            localStorage.setItem('new_analysis_ids', JSON.stringify(ids));
            setIsAuth(true);
            setStep('results');
        } catch (error: any) {
            toast({ title: t('toasts.errorTitle'), description: error.response?.data?.message || t('toasts.invalidCode'), variant: "destructive" });
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
                        <h3 className="text-lg font-bold text-slate-900 text-center">{t('analyzing.title')}</h3>
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
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">{t('form.title')}</h3>
                        <p className="text-slate-700 text-sm sm:text-base leading-relaxed text-left transparent backdrop-blur-sm p-4 rounded-2xl shadow-md transition-shadow">
                            {t('form.description')}
                        </p>
                    </div>
                    <form onSubmit={handleRequestSubmit} className="relative z-10 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('form.emailLabel')} <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input required type="email" placeholder={t('form.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-transparent backdrop-blur-md shadow-md transition-shadow rounded-xl focus:ring-2 focus:ring-[#00be64]/20 focus:border-accent outline-none transition-all font-medium placeholder:text-slate-400" />
                            </div>
                        </div>
                        {/* ПОЛЕ ВВОДА ТЕЛЕФОНА УДАЛЕНО */}
                        <button type="submit" disabled={isSubmitting || !email} className="w-full group flex items-center justify-center gap-2 bg-secondary text-white px-6 py-4 rounded-xl hover:bg-accent disabled:bg-slate-300 disabled:cursor-not-allowed transition-all font-bold text-lg mt-6 shadow-lg shadow-[#3f94ca]/30">
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t('form.submitButton')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
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
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">{t('verify.title')}</h3>
                        <p className="text-slate-700 text-sm sm:text-base leading-relaxed text-center">
                            <span dangerouslySetInnerHTML={{ __html: t('verify.descLine1', { email }) }} /> <br/>
                            {t('verify.descLine2')}
                        </p>
                    </div>
                    <form onSubmit={handleVerifySubmit} className="relative z-10 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('verify.codeLabel')}</label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input required type="text" placeholder={t('verify.codePlaceholder')} value={code} onChange={e => setCode(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-transparent backdrop-blur-md shadow-md transition-shadow rounded-xl focus:ring-2 focus:ring-[#3f94ca]/20 focus:border-accent outline-none transition-all font-medium placeholder:text-slate-400" />
                            </div>
                        </div>
                        <button type="submit" disabled={isSubmitting || !code} className="w-full group flex items-center justify-center gap-2 bg-secondary text-white px-6 py-4 rounded-xl hover:bg-accent disabled:bg-slate-300 disabled:cursor-not-allowed transition-all font-bold text-lg mt-6 shadow-lg shadow-[#3f94ca]/30">
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t('verify.submitButton')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                        </button>
                    </form>
                </div>
            )}

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
                            {allCompleted ? t('results.titleCompleted') : t('results.titlePending')}
                        </h3>
                        <p className="text-slate-600 text-sm font-medium px-4">
                            {allCompleted ? t('results.descCompleted') : t('results.descPending')}
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
                                        <span className="font-bold text-slate-800">{t('results.document', { index: idx + 1 })}</span>
                                    </div>
                                    
                                    {isDone ? (
                                        <Link href={`/analysis/${id}`} className="flex items-center gap-1.5 text-sm font-bold bg-white border border-slate-200 px-4 py-2 rounded-lg text-[#3f94ca] hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm">
                                            {t('results.viewButton')} <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-400 bg-slate-200/50 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                            {t('results.inProgress')}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {allCompleted && (
                        <button 
                            onClick={() => router.push('/dashboard')} 
                            className="w-full bg-secondary text-white font-bold text-lg py-4 rounded-xl hover:bg-accent transition-colors shadow-lg"
                        >
                            {t('results.dashboardButton')}
                        </button>
                    )}
                </div>
            )}

        </main>
    );
}