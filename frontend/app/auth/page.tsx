'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2, Mail, Phone, Lock, ArrowRight, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useToast } from '@/components/ui/toast';

// Импортируем наш фон
import StaticBackground from '@/components/background/StaticBackground';

export default function AuthPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    // ИЗМЕНЕНИЕ 1: Добавили состояние verify
    const [mode, setMode] = useState<'login' | 'register' | 'verify'>('register');
    const [isLoading, setIsLoading] = useState(false);
    
    // Форма
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState(''); // Используем и для пароля, и для ПИН-кода

    // --- УМНАЯ МАСКА ДЛЯ ТЕЛЕФОНА (СНГ) ---
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value.replace(/\D/g, '');

        if (!input) {
            setPhone('');
            return;
        }

        if (input[0] === '8') input = '7' + input.slice(1);
        
        if (!['7', '3', '9'].includes(input[0])) {
            input = '7' + input;
        }

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'register') {
            const phoneDigits = phone.replace(/\D/g, '');
            if (phoneDigits.length < 11) {
                toast({
                    title: "Ошибка",
                    description: "Введите корректный номер телефона полностью",
                    variant: "destructive",
                });
                return;
            }
        }

        setIsLoading(true);

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        
        try {
            if (mode === 'register') {
                // --- РЕГИСТРАЦИЯ ---
                await axios.post(`${baseUrl}/auth/register`, { email, phone });
                
                toast({
                    title: "Код отправлен!",
                    description: `Мы выслали 6-значный код на ${email}`,
                    variant: "success",
                });

                // ИЗМЕНЕНИЕ 2: Включаем режим ввода кода
                setMode('verify'); 
                setPassword(''); // Очищаем поле на всякий случай
            } else {
                // --- ВХОД ИЛИ ПОДТВЕРЖДЕНИЕ КОДА ---
                // Бэкенд принимает код как обычный пароль
                const response = await axios.post(`${baseUrl}/auth/login`, {
                    email,
                    password
                });
                
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user_email', response.data.user_email);
                
                window.dispatchEvent(new Event('auth-change'));
                
                toast({
                    title: "Добро пожаловать!",
                    description: "Вход выполнен успешно.",
                    variant: "success",
                });
                
                const searchParams = new URLSearchParams(window.location.search);
                const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
                
                router.push(callbackUrl);
            }
        } catch (err: any) {
            console.error(err);
            const status = err.response?.status;
            const msg = err.response?.data?.message || 'Произошла ошибка. Проверьте данные.';
            
            // ИЗМЕНЕНИЕ 3: Умная обработка ошибок
            if (mode === 'register' && status === 400) {
                setMode('login'); // Кидаем на окно входа
                toast({
                    title: "Аккаунт уже существует",
                    description: "Этот email уже зарегистрирован. Пожалуйста, войдите с вашим паролем.",
                    variant: "warning",
                    action: {
                        label: "Сбросить пароль",
                        onClick: () => router.push('/auth/reset-password')
                    }
                });
            } else if (mode === 'verify' && status === 401) {
                 toast({
                    title: "Неверный код",
                    description: "Проверьте цифры из письма и попробуйте еще раз.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Ошибка",
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
                
                {/* Заголовок */}
                <div className="bg-secondary p-6 text-center transition-colors">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {mode === 'register' ? 'Создать аккаунт' : mode === 'login' ? 'С возвращением' : 'Подтверждение'}
                    </h2>
                    <p className="text-white text-md font-medium">
                        {mode === 'register' 
                            ? 'Введите данные для получения доступа' 
                            : mode === 'login' 
                                ? 'Введите email и пароль для входа'
                                : 'Введите код, отправленный на email'}
                    </p>
                </div>

                {/* Переключатель вкладок (Скрываем, если мы вводим код) */}
                {mode !== 'verify' && (
                    <div className="flex border-b border-slate-200/50 bg-white/50">
                        <button 
                            onClick={() => setMode('register')}
                            className={clsx("flex-1 py-3 text-sm font-medium transition-colors", 
                                mode === 'register' ? "text-secondary border-b-2 border-secondary bg-white/80" : "text-slate-500 hover:text-slate-700")}
                        >
                            Регистрация
                        </button>
                        <button 
                            onClick={() => setMode('login')}
                            className={clsx("flex-1 py-3 text-sm font-medium transition-colors", 
                                mode === 'login' ? "text-secondary border-b-2 border-secondary bg-white/80" : "text-slate-500 hover:text-slate-700")}
                        >
                            Вход
                        </button>
                    </div>
                )}

                {/* Форма */}
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    
                    {/* Email (Блокируем ввод, если мы на шаге проверки кода) */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase">Email</label>
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

                    {/* Телефон (Только при регистрации) */}
                    {mode === 'register' && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-bold text-slate-700 uppercase">Телефон</label>
                            <div className="relative">
                                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input 
                                    type="tel" 
                                    required
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    className="w-full pl-10 pr-4 py-2 bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                                    placeholder="+7 (999) 000-00-00"
                                />
                            </div>
                        </div>
                    )}

                    {/* Пароль ИЛИ Код (При входе или верификации) */}
                    {(mode === 'login' || mode === 'verify') && (
                         <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-700 uppercase">
                                    {mode === 'verify' ? 'Код из письма' : 'Пароль'}
                                </label>
                                {mode === 'login' && (
                                    <Link href="/auth/reset-password" className="text-xs text-secondary hover:underline">
                                        Забыли пароль?
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
                        {mode === 'register' ? 'Получить код' : mode === 'verify' ? 'Подтвердить' : 'Войти'}
                    </button>
                    
                    {mode === 'register' && (
                         <p className="text-xs text-accent text-center leading-relaxed font-medium">
                            Нажимая кнопку, вы соглашаетесь с правилами обработки персональных данных. 
                            Код доступа будет выслан на указанный Email.
                        </p>
                    )}

                    {mode === 'verify' && (
                        <p className="text-xs text-slate-500 text-center cursor-pointer hover:text-secondary hover:underline" onClick={() => setMode('register')}>
                            Вернуться назад
                        </p>
                    )}
                </form>
            </div>
        </main>
    );
}