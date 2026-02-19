'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { claimAnalysis } from '@/lib/api';
import { Loader2, Mail, Phone, FileCheck, ArrowRight } from 'lucide-react';

export default function ClaimPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await claimAnalysis(id, email, phone);
            // ПЕРЕНАПРАВЛЯЕМ НА СТРАНИЦУ ВХОДА С ПАРАМЕТРОМ ВОЗВРАТА
            router.push(`/auth?callbackUrl=/analysis/${id}`);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Произошла ошибка при сохранении данных.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                
                <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500 rounded-full opacity-50"></div>
                    <FileCheck className="w-12 h-12 text-white mx-auto mb-4 relative z-10" />
                    <h2 className="text-2xl font-bold text-white relative z-10">
                        Анализы расшифрованы!
                    </h2>
                </div>

                <div className="p-8">
                    <p className="text-sm text-slate-600 leading-relaxed mb-6 text-center">
                        Ваши медицинские анализы успешно расшифрованы. Для получения результата, пожалуйста, укажите вашу электронную почту и телефон. Это нужно для того, чтобы мы автоматически создали для вас личный кабинет (на почту придет логин и пароль) и в дальнейшем вы сможете хранить все анализы в одном месте и сравнивать их друг с другом.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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

                        <div className="space-y-1">
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
                            ПОЛУЧИТЬ РЕЗУЛЬТАТ
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}