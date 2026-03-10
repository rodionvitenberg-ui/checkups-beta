'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useToast } from '@/components/ui/toast';

// Импортируем наш фон
import StaticBackground from '@/components/background/StaticBackground';

export default function AuthPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [mode, setMode] = useState<'login' | 'register'>('register');
    const [isLoading, setIsLoading] = useState(false);
    
    // Форма
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    // --- УМНАЯ МАСКА ДЛЯ ТЕЛЕФОНА (СНГ) ---
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value.replace(/\D/g, '');

        if (!input) {
            setPhone('');
            return;
        }

        // Автозамена 8 на 7
        if (input[0] === '8') input = '7' + input.slice(1);
        
        // Жесткая привязка к СНГ
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
            formatted += input.substring(0, 3);
        }

        setPhone(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Валидация телефона при регистрации
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
                await axios.post(`${baseUrl}/auth/register`, {
                    email,
                    phone
                });
                
                toast({
                    title: "Регистрация успешна!",
                    description: `Пароль отправлен на ${email}. Проверьте почту.`,
                    variant: "success",
                });

                setMode('login'); 
            } else {
                // --- ВХОД ---
                const response = await axios.post(`${baseUrl}/auth/login`, {
                    email,
                    password
                });
                
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user_email', response.data.user_email);
                
                // Сигнал хедеру обновить кнопку
                window.dispatchEvent(new Event('auth-change'));
                
                toast({
                    title: "Добро пожаловать!",
                    description: "Вход выполнен успешно.",
                    variant: "success",
                });
                
                // Читаем callbackUrl из адресной строки
                const searchParams = new URLSearchParams(window.location.search);
                const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
                
                router.push(callbackUrl);
            }
        } catch (err: any) {
            console.error(err);
            const status = err.response?.status;
            const msg = err.response?.data?.message || 'Произошла ошибка. Проверьте данные.';
            
            // СПЕЦИАЛЬНАЯ ОБРАБОТКА: Пользователь уже существует
            if (mode === 'register' && status === 400) {
                toast({
                    title: "Аккаунт уже существует",
                    description: "Этот email уже зарегистрирован. Хотите восстановить пароль?",
                    variant: "warning",
                    action: {
                        label: "Сбросить пароль",
                        onClick: () => router.push('/auth/reset-password')
                    }
                });
            } else {
                // Обычная ошибка
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
        <main className="relative min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
            
            <StaticBackground imageUrl="/background/test.png" />

            <div className="relative z-10 bg-white/80 backdrop-blur-md w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-white/40">
                
                {/* Заголовок */}
                <div className="bg-secondary p-6 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {mode === 'register' ? 'Создать аккаунт' : 'С возвращением'}
                    </h2>
                    <p className="text-white text-md">
                        {mode === 'register' 
                            ? 'Введите данные для получения доступа' 
                            : 'Введите email и пароль для входа'}
                    </p>
                </div>

                {/* Переключатель */}
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

                {/* Форма */}
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    
                    {/* Email (Всегда) */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase">Email</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                                {/* ИЗМЕНЕНИЕ: Заменили onChange на handlePhoneChange */}
                                <input 
                                    type="tel" 
                                    required
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    className="w-full pl-10 pr-4 py-2 bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="+7 (999) 000-00-00"
                                />
                            </div>
                        </div>
                    )}

                    {/* Пароль (Только при входе) */}
                    {mode === 'login' && (
                         <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-700 uppercase">Пароль</label>
                                <Link href="/auth/reset-password" className="text-xs text-secondary hover:underline">
                                    Забыли пароль?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-secondary/70 text-white font-bold py-2.5 rounded-lg hover:bg-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                        {mode === 'register' ? 'Получить пароль' : 'Войти'}
                    </button>
                    
                    {mode === 'register' && (
                         <p className="text-xs text-slate-500 text-center leading-relaxed font-medium">
                            Нажимая кнопку, вы соглашаетесь с правилами обработки персональных данных. 
                            Пароль будет выслан на указанный Email.
                        </p>
                    )}
                </form>
            </div>
        </main>
    );
}