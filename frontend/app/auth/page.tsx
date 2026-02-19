'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useToast } from '@/components/ui/toast';

export default function AuthPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [mode, setMode] = useState<'login' | 'register'>('register');
    const [isLoading, setIsLoading] = useState(false);
    
    // Форма
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
                
                toast({
                    title: "Добро пожаловать!",
                    description: "Вход выполнен успешно.",
                    variant: "success",
                });
                
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            const status = err.response?.status;
            const msg = err.response?.data?.message || 'Произошла ошибка. Проверьте данные.';
            
            // СПЕЦИАЛЬНАЯ ОБРАБОТКА: Пользователь уже существует (400 при регистрации)
            if (mode === 'register' && status === 400) {
                toast({
                    title: "Аккаунт уже существует",
                    description: "Этот email уже зарегистрирован. Хотите восстановить пароль?",
                    variant: "warning", // Используем желтый/предупреждающий стиль
                    action: {
                        label: "Сбросить пароль",
                        onClick: () => router.push('/auth/reset-password-request')
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
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                
                {/* Заголовок */}
                <div className="bg-slate-900 p-6 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {mode === 'register' ? 'Создать аккаунт' : 'С возвращением'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {mode === 'register' 
                            ? 'Введите данные для получения доступа' 
                            : 'Введите email и пароль для входа'}
                    </p>
                </div>

                {/* Переключатель */}
                <div className="flex border-b border-slate-100">
                    <button 
                        onClick={() => setMode('register')}
                        className={clsx("flex-1 py-3 text-sm font-medium transition-colors", 
                            mode === 'register' ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700")}
                    >
                        Регистрация
                    </button>
                    <button 
                        onClick={() => setMode('login')}
                        className={clsx("flex-1 py-3 text-sm font-medium transition-colors", 
                            mode === 'login' ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700")}
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
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                                <Link href="/auth/reset-password-request" className="text-xs text-blue-600 hover:underline">
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
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                        {mode === 'register' ? 'Получить пароль' : 'Войти'}
                    </button>
                    
                    {mode === 'register' && (
                         <p className="text-xs text-slate-400 text-center leading-relaxed">
                            Нажимая кнопку, вы соглашаетесь с правилами обработки персональных данных. 
                            Пароль будет выслан на указанный Email.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}