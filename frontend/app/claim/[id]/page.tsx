'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { claimRequest, claimVerify } from '@/lib/api';
import { Loader2, Mail, Phone, FileCheck, ArrowRight, Key, Lock } from 'lucide-react';

export default function ClaimPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    
    // Шаг 1: Запрос кода
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    
    // Шаг 2: Подтверждение
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // ОБРАБОТЧИК ШАГА 1
    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await claimRequest(id, email, phone);
            setStep(2); // Переходим на следующий шаг
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Ошибка при отправке кода. Проверьте данные.');
        } finally {
            setIsLoading(false);
        }
    };

    // ОБРАБОТЧИК ШАГА 2
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Пароли не совпадают. Попробуйте еще раз.');
            return;
        }
        
        if (password.length < 6) {
            setError('Пароль должен содержать минимум 6 символов.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await claimVerify(id, email, code, password, phone);
            // Если успех - токены уже в localStorage. Кидаем на анализ!
            router.push(`/analysis/${id}`);
            router.refresh(); 
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Неверный код или ошибка сервера.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                
                {/* ШАПКА ФОРМЫ */}
                <div className="bg-slate-900 px-6 py-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/grid.svg')] bg-center" />
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileCheck className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {step === 1 ? 'Анализ готов' : 'Подтверждение'}
                        </h1>
                        <p className="text-slate-300 text-sm max-w-sm mx-auto">
                            {step === 1 
                                ? 'Ваши медицинские анализы успешно расшифрованы. Укажите контакты для получения результата.'
                                : `Мы отправили 6-значный код на ${email}. Введите его ниже и придумайте пароль.`}
                        </p>
                    </div>
                </div>

                {/* ФОРМА */}
                <div className="p-6 sm:p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center font-medium">
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleRequestCode} className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">Электронная почта</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
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

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                ПОЛУЧИТЬ КОД
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyCode} className="space-y-5 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">Код из письма</label>
                                <div className="relative">
                                    <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        type="text" 
                                        required
                                        maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // Только цифры
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm tracking-widest font-mono font-bold"
                                        placeholder="123456"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">Придумайте пароль</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        type="password" 
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="Минимум 6 символов"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">Повторите пароль</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        type="password" 
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="Повторите пароль"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-all text-sm"
                                >
                                    Назад
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isLoading || code.length < 6}
                                    className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ЗАВЕРШИТЬ'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}