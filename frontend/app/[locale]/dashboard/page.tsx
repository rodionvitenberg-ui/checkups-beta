'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Plus, Loader2, LogOut, Key, X } from 'lucide-react';
import { getProfiles } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { FileUploader } from '@/components/home/FileUploader';
import StaticBackground from '@/components/background/StaticBackground';
import { ChangePasswordModal } from '@/components/dashboard/ChangePasswordModal';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { ProStatusCard } from '@/components/dashboard/ProStatusCard';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
    const router = useRouter();
    const t = useTranslations('Dashboard.Page');
    const [expandedProfileId, setExpandedProfileId] = useState<number | null>(null);
    
    // Наши стейты для модальных окон
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const { data: profiles = [], isLoading } = useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const data = await getProfiles();
            return data.sort((a, b) => {
                if (a.full_name === "Анализы" || a.full_name.includes("Основной")) return -1;
                if (b.full_name === "Анализы" || b.full_name.includes("Основной")) return 1;
                return 0;
            });
        }
    });

    if (!isLoading && profiles.length > 0 && expandedProfileId === null) {
        setExpandedProfileId(profiles[0].id);
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_email');
        window.dispatchEvent(new Event('auth-change'));
        router.push('/'); 
    };

    if (isLoading) {
        return (
            <main className="relative min-h-screen flex items-center justify-center">
                <StaticBackground imageUrl="/background/legal.png" />
                <div className="relative z-10 flex flex-col items-center gap-4 bg-white/70 backdrop-blur-md p-8 rounded-3xl border border-white/40 shadow-sm">
                    <Loader2 className="w-10 h-10 text-[#3f94ca] animate-spin" />
                    <p className="text-slate-700 font-medium animate-pulse">{t('loadingData')}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <StaticBackground imageUrl="/background/legal.png" />

            <div className="relative z-10 max-w-4xl mx-auto">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 tracking-tight">
                            {t('title')}
                        </h1>
                        <p className="text-slate-600 mt-1 font-medium">{t('subtitle')}</p>
                    </div>
                    
                    <button 
                        onClick={() => setIsUploadModalOpen(true)} 
                        className="group flex items-center justify-center gap-2 bg-gradient-to-r from-[#3f94ca] to-[#00be64] text-white px-6 py-3 rounded-2xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(63,148,202,0.3)] hover:shadow-[0_0_25px_rgba(0,190,100,0.4)] hover:-translate-y-0.5 font-semibold w-full sm:w-auto"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        <span>{t('uploadAnalysis')}</span>
                    </button>
                </div>

                {/* СТАТУС ПОДПИСКИ PRO */}
                <ProStatusCard />

                {/* СПИСОК ПРОФИЛЕЙ */}
                <div className="space-y-5">
                    {profiles.map((profile) => (
                        <ProfileCard 
                            key={profile.id} 
                            profile={profile} 
                            isExpanded={expandedProfileId === profile.id}
                            onToggle={() => setExpandedProfileId(prev => prev === profile.id ? null : profile.id)}
                        />
                    ))}
                </div>

                {/* НАСТРОЙКИ АККАУНТА */}
                <div className="mt-12 pt-8 border-t border-slate-300/50">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 drop-shadow-sm">{t('settingsTitle')}</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3 bg-white/70 backdrop-blur-md border border-white/40 text-slate-800 font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-sm"
                        >
                            <Key className="w-5 h-5 text-slate-500" />
                            {t('changePassword')}
                        </button>
                        
                        <button 
                            onClick={handleLogout}
                            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3 bg-red-50/80 backdrop-blur-md text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors shadow-sm border border-red-100/50"
                        >
                            <LogOut className="w-5 h-5 text-red-500" />
                            {t('logout')}
                        </button>
                    </div>
                </div>

                {/* --- МОДАЛЬНЫЕ ОКНА --- */}
                
                {/* Окно смены пароля */}
                {isPasswordModalOpen && (
                    <ChangePasswordModal onClose={() => setIsPasswordModalOpen(false)} />
                )}

                {/* Окно загрузки анализа */}
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative border border-white/20">
                            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-xl font-bold text-slate-900">{t('uploadModalTitle')}</h3>
                                <button 
                                    onClick={() => setIsUploadModalOpen(false)} 
                                    className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1.5 shadow-sm border border-slate-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6">
                                <FileUploader /> 
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}