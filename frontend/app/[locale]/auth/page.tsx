'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2, Mail, Lock, ArrowRight, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';
import { API_BASE_URL } from '@/lib/api';

// Импортируем наш фон
import StaticBackground from '@/components/background/StaticBackground';

export default function AuthPage() {
    const router = useRouter();
    const { toast } = useToast();
    const t = useTranslations('Auth');
    
    const [mode, setMode] = useState<'login' | 'register' | 'verify'>('register');
    const [isLoading, setIsLoading] = useState(false);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); 

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (mode === 'register') {
                // --- РЕГИСТРАЦИЯ ---
                await axios.post(`${API_BASE_URL}/auth/register`, { email });
                
                toast({
                    title: t('toast.codeSentTitle'),
                    description: t('toast.codeSentDesc', { email }),
                    variant: "success",
                });

                setMode('verify'); 
                setPassword(''); 
            } else {
                // --- ВХОД ИЛИ ПОДТВЕРЖДЕНИЕ КОДА ---
                const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                    email,
                    password
                });
                
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user_email', response.data.user_email);
                
                window.dispatchEvent(new Event('auth-change'));
                
                toast({
                    title: t('toast.welcomeTitle'),
                    description: t('toast.welcomeDesc'),
                    variant: "success",
                });
                
                const searchParams = new URLSearchParams(window.location.search);
                const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
                
                router.push(callbackUrl);
            }
        } catch (err: any) {
            console.error(err);
            const status = err.response?.status;
            const msg = err.response?.data?.message || t('toast.defaultError');
            
            if (mode === 'register' && status === 400) {
                setMode('login'); 
                toast({
                    title: t('toast.accountExistsTitle'),
                    description: t('toast.accountExistsDesc'),
                    variant: "warning",
                    action: {
                        label: t('toast.resetPasswordBtn'),
                        onClick: () => router.push('/auth/reset-password')
                    }
                });
            } else if (mode === 'verify' && status === 401) {
                 toast({
                    title: t('toast.invalidCodeTitle'),
                    description: t('toast.invalidCodeDesc'),
                    variant: "destructive",
                });
            } else {
                toast({
                    title: t('toast.errorTitle'),
                    description: msg,
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen flex items-center justify-center px-4 pt-28 pb-12 sm:pt-20 sm:pb-20">
            
            <StaticBackground imageUrl="/background/test.png" />

            <div className="relative z-10 bg-white/80 backdrop-blur-md w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-white/40 my-auto animate-in fade-in zoom-in-95 duration-300">
                
                <div className="bg-secondary p-6 text-center transition-colors">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {mode === 'register' ? t('titleRegister') : mode === 'login' ? t('titleLogin') : t('titleVerify')}
                    </h2>
                    <p className="text-white text-md font-medium">
                        {mode === 'register' 
                            ? t('descRegister') 
                            : mode === 'login' 
                                ? t('descLogin')
                                : t('descVerify')}
                    </p>
                </div>

                {mode !== 'verify' && (
                    <div className="flex border-b border-slate-200/50 bg-white/50">
                        <button 
                            onClick={() => setMode('register')}
                            className={clsx("flex-1 py-3 text-sm font-medium transition-colors", 
                                mode === 'register' ? "text-secondary border-b-2 border-secondary bg-white/80" : "text-slate-500 hover:text-slate-700")}
                        >
                            {t('tabRegister')}
                        </button>
                        <button 
                            onClick={() => setMode('login')}
                            className={clsx("flex-1 py-3 text-sm font-medium transition-colors", 
                                mode === 'login' ? "text-secondary border-b-2 border-secondary bg-white/80" : "text-slate-500 hover:text-slate-700")}
                        >
                            {t('tabLogin')}
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase">{t('emailLabel')}</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input 
                                type="email" 
                                required
                                disabled={mode === 'verify'}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm disabled:opacity-60 disabled:bg-slate-50"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    {(mode === 'login' || mode === 'verify') && (
                         <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-700 uppercase">
                                    {mode === 'verify' ? t('codeLabel') : t('passwordLabel')}
                                </label>
                                {mode === 'login' && (
                                    <Link href="/auth/reset-password" className="text-xs text-secondary hover:underline">
                                        {t('forgotPassword')}
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                {mode === 'verify' ? (
                                    <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                ) : (
                                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                )}
                                <input 
                                    type={mode === 'verify' ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm font-medium tracking-wide"
                                    placeholder={mode === 'verify' ? "123456" : "••••••••"}
                                    maxLength={mode === 'verify' ? 6 : undefined}
                                />
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={clsx(
                            "w-full text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5",
                            mode === 'verify' ? "bg-secondary hover:bg-accent" : "bg-secondary/90 hover:bg-secondary shadow-secondary/30"
                        )}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                        {mode === 'register' ? t('btnRegister') : mode === 'verify' ? t('btnVerify') : t('btnLogin')}
                    </button>
                    
                    {mode === 'register' && (
                         <p className="text-xs text-accent text-center leading-relaxed font-medium">
                            {t('agreement')}
                        </p>
                    )}

                    {mode === 'verify' && (
                        <p className="text-xs text-slate-500 text-center cursor-pointer hover:text-secondary hover:underline" onClick={() => setMode('register')}>
                            {t('goBack')}
                        </p>
                    )}
                </form>
            </div>
        </main>
    );
}