'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2, Mail, Lock, ArrowRight, CheckCircle, ArrowLeft, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast'; // Проверь путь, если toast.tsx лежит в другом месте

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    // Параметры из URL (если пришли из письма)
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');

    // Определяем режим: Запрос сброса (request) или Установка пароля (confirm)
    const mode = uid && token ? 'confirm' : 'request';

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); // Для экрана "Письмо отправлено"
    
    // Поля формы
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

        try {
            if (mode === 'request') {
                // 1. ЗАПРОС ССЫЛКИ
                await axios.post(`${baseUrl}/auth/reset-password-request`, { email });
                
                setIsSuccess(true);
                toast({
                    title: "Письмо отправлено",
                    description: "Проверьте вашу почту (и папку Спам).",
                    variant: "success",
                });

            } else {
                // 2. УСТАНОВКА НОВОГО ПАРОЛЯ
                if (password !== confirmPassword) {
                    toast({
                        title: "Ошибка",
                        description: "Пароли не совпадают",
                        variant: "destructive",
                    });
                    setIsLoading(false);
                    return;
                }

                if (password.length < 6) {
                    toast({
                        title: "Ошибка",
                        description: "Пароль должен быть не менее 6 символов",
                        variant: "destructive",
                    });
                    setIsLoading(false);
                    return;
                }

                await axios.post(`${baseUrl}/auth/reset-password-confirm`, {
                    uidb64: uid,
                    token: token,
                    new_password: password
                });

                toast({
                    title: "Успешно!",
                    description: "Пароль изменен. Теперь вы можете войти.",
                    variant: "success",
                });
                
                // Редирект на логин через 2 секунды
                setTimeout(() => router.push('/auth'), 2000);
            }

        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || "Произошла ошибка";
            toast({
                title: "Ошибка",
                description: msg,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Рендер: Экран успеха (только для режима request) ---
    if (mode === 'request' && isSuccess) {
        return (
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 text-center border border-slate-100">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Проверьте почту</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    Мы отправили инструкцию по сбросу пароля на <strong>{email}</strong>.
                    Ссылка действительна 24 часа.
                </p>
                <Link 
                    href="/auth" 
                    className="block w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-200 transition-colors"
                >
                    Вернуться ко входу
                </Link>
            </div>
        );
    }

    // --- Рендер: Форма ---
    return (
        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-slate-900 p-6 text-center relative">
                {/* Кнопка назад (только если мы не в режиме подтверждения) */}
                {mode === 'request' && (
                    <Link href="/auth" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                )}
                
                <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    {mode === 'request' ? 'Сброс пароля' : 'Новый пароль'}
                </h2>
                <p className="text-slate-400 text-xs">
                    {mode === 'request' 
                        ? 'Введите email, чтобы получить ссылку' 
                        : 'Придумайте надежный пароль'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
                
                {mode === 'request' ? (
                    // Поле EMAIL
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
                ) : (
                    // Поля ПАРОЛЯ
                    <>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 uppercase">Новый пароль</label>
                            <div className="relative">
                                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
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
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 uppercase">Повторите пароль</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input 
                                    type="password" 
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </>
                )}

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    {mode === 'request' ? 'Отправить ссылку' : 'Сохранить пароль'}
                </button>
            </form>
        </div>
    );
}

// Оборачиваем в Suspense, так как используем useSearchParams
export default function ResetPasswordPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center p-4">
            <Suspense fallback={<Loader2 className="w-8 h-8 text-blue-600 animate-spin" />}>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}