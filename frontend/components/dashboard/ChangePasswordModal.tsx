'use client';

import { useState } from 'react';
import { X, Lock, Loader2, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { changePassword } from '@/lib/api';

interface ChangePasswordModalProps {
    onClose: () => void;
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Новые состояния для инлайн-уведомлений
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Очищаем предыдущие сообщения
        setErrorMsg(null);
        setSuccessMsg(null);

        if (newPassword !== confirmPassword) {
            setErrorMsg("Новые пароли не совпадают");
            return;
        }

        if (newPassword.length < 6) {
            setErrorMsg("Пароль должен содержать минимум 6 символов");
            return;
        }

        setIsLoading(true);
        try {
            await changePassword(oldPassword, newPassword);
            setSuccessMsg("Пароль успешно изменен!");
            
            // Очищаем форму
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            
            // Даем пользователю 2 секунды полюбоваться зеленым сообщением, затем закрываем
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error: any) {
            console.error(error);
            // Берем сообщение об ошибке с бэкенда (которое мы настроили на статус 400)
            const msg = error.response?.data?.message || 'Неверный текущий пароль или ошибка сервера';
            setErrorMsg(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Функция для сброса ошибки при наборе текста (чтобы красная плашка не висела вечно)
    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
        setter(value);
        if (errorMsg) setErrorMsg(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative border border-white/20">
                
                {/* Шапка */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#3f94ca]/10 flex items-center justify-center text-[#3f94ca]">
                            <KeyRound className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Смена пароля</h3>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1.5 shadow-sm border border-slate-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Форма */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    {/* Блок для вывода инлайн-сообщений */}
                    {errorMsg && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="p-3 bg-[#00be64]/10 border border-[#00be64]/20 text-[#00be64] rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Текущий пароль</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                            <input 
                                type="password" required value={oldPassword} 
                                onChange={(e) => handleInputChange(setOldPassword, e.target.value)}
                                disabled={!!successMsg}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3f94ca] text-sm transition-all disabled:opacity-50"
                                placeholder="Введите старый пароль"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Новый пароль</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                            <input 
                                type="password" required value={newPassword} 
                                onChange={(e) => handleInputChange(setNewPassword, e.target.value)}
                                disabled={!!successMsg}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3f94ca] text-sm transition-all disabled:opacity-50"
                                placeholder="Минимум 6 символов"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Подтвердите пароль</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                            <input 
                                type="password" required value={confirmPassword} 
                                onChange={(e) => handleInputChange(setConfirmPassword, e.target.value)}
                                disabled={!!successMsg}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3f94ca] text-sm transition-all disabled:opacity-50"
                                placeholder="Повторите новый пароль"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={isLoading || !!successMsg}
                            className="w-full bg-secondary text-white font-bold py-3 rounded-xl hover:bg-accent transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#3f94ca]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Сохранить изменения'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}