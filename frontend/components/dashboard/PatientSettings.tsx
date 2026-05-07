'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, Plus, X, Activity, Heart, Coffee, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { updateProfile, getPatientTraits, removePatientTrait } from '@/lib/api';
import { PatientProfile, PatientTraitLink } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { TraitModal } from './TraitModal'; // ИМПОРТИРУЕМ НАШ ПОРТАЛ

export function PatientSettings({ profile }: { profile: PatientProfile }) {
    const t = useTranslations('Dashboard.PatientSettings');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        weight: profile.weight || '',
        height: profile.height || '',
        gender: profile.gender || '',
        birth_date: profile.birth_date || '',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: patientTraits = [], isLoading: isLoadingPatientTraits } = useQuery({
        queryKey: ['patientTraits', profile.id],
        queryFn: () => getPatientTraits(profile.id),
    });

    const updateSettingsMutation = useMutation({
        mutationFn: (data: Partial<PatientProfile>) => updateProfile(profile.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            toast({ title: t('successTitle'), description: t('successDesc'), variant: "success" });
        },
        onError: () => toast({ title: t('errorTitle'), description: t('errorDesc'), variant: "destructive" })
    });

    const removeTraitMutation = useMutation({
        mutationFn: (linkId: number) => removePatientTrait(linkId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patientTraits', profile.id] });
            toast({ title: t('successTitle'), description: t('traitRemoved'), variant: "success" });
        }
    });

    const handleSaveBase = () => {
        const payload: Partial<PatientProfile> = {
            full_name: profile.full_name, 
            weight: formData.weight ? parseFloat(formData.weight.toString()) : null,
            height: formData.height ? parseFloat(formData.height.toString()) : null,
            gender: (formData.gender as 'M' | 'F') || null, 
            birth_date: formData.birth_date || null,
        };
        updateSettingsMutation.mutate(payload);
    };

    const hasChanges = 
        String(formData.weight || '') !== String(profile.weight || '') ||
        String(formData.height || '') !== String(profile.height || '') ||
        String(formData.gender || '') !== String(profile.gender || '') ||
        String(formData.birth_date || '') !== String(profile.birth_date || '');

    const categoryIcons: Record<string, any> = {
        disease: <Activity className="w-4 h-4 text-red-500" />,
        bad_habit: <ShieldAlert className="w-4 h-4 text-orange-500" />,
        good_habit: <Heart className="w-4 h-4 text-green-500" />,
        feature: <Coffee className="w-4 h-4 text-blue-500" />
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
            
            {/* БАЗОВЫЕ ПАРАМЕТРЫ */}
            <div className="bg-white/80 backdrop-blur-md p-5 sm:p-7 rounded-3xl border border-white/60 shadow-sm">
                <h4 className="text-lg font-bold text-slate-800 mb-4">{t('baseParamsTitle')}</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
                    
                    {/* ПОЛ */}
                    <div className="space-y-2">
                        <label htmlFor={`gender-${profile.id}`} className="text-sm font-semibold text-slate-700 ml-1">{t('genderLabel', { fallback: 'Пол' })}</label>
                        <select
                            id={`gender-${profile.id}`}
                            value={formData.gender}
                            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                            className="w-full bg-white/50 border border-slate-200 focus:border-[#3f94ca] focus:ring-2 focus:ring-[#3f94ca]/20 rounded-xl px-4 py-2.5 outline-none text-slate-700"
                        >
                            <option value="">{t('genderNotSelected', { fallback: 'Не указан' })}</option>
                            <option value="M">{t('genderMale', { fallback: 'Мужской' })}</option>
                            <option value="F">{t('genderFemale', { fallback: 'Женский' })}</option>
                        </select>
                    </div>

                    {/* ДАТА РОЖДЕНИЯ */}
                    <div className="space-y-2">
                        <label htmlFor={`dob-${profile.id}`} className="text-sm font-semibold text-slate-700 ml-1">{t('dobLabel', { fallback: 'Дата рождения' })}</label>
                        <input
                            id={`dob-${profile.id}`} type="date"
                            value={formData.birth_date} 
                            onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                            className="w-full bg-white/50 border border-slate-200 focus:border-[#3f94ca] focus:ring-2 focus:ring-[#3f94ca]/20 rounded-xl px-4 py-2.5 outline-none text-slate-700"
                        />
                    </div>

                    {/* РОСТ */}
                    <div className="space-y-2">
                        <label htmlFor={`height-${profile.id}`} className="text-sm font-semibold text-slate-700 ml-1">{t('heightLabel')}</label>
                        <input
                            id={`height-${profile.id}`} type="number" min="50" max="250" placeholder="175"
                            value={formData.height} onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                            className="w-full bg-white/50 border border-slate-200 focus:border-[#3f94ca] focus:ring-2 focus:ring-[#3f94ca]/20 rounded-xl px-4 py-2.5 outline-none"
                        />
                    </div>

                    {/* ВЕС */}
                    <div className="space-y-2">
                        <label htmlFor={`weight-${profile.id}`} className="text-sm font-semibold text-slate-700 ml-1">{t('weightLabel')}</label>
                        <input
                            id={`weight-${profile.id}`} type="number" min="10" max="300" step="0.1" placeholder="70.5"
                            value={formData.weight} onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                            className="w-full bg-white/50 border border-slate-200 focus:border-[#3f94ca] focus:ring-2 focus:ring-[#3f94ca]/20 rounded-xl px-4 py-2.5 outline-none"
                        />
                    </div>
                </div>

                {hasChanges && (
                    <div className="mt-6 flex justify-end">
                        <button onClick={handleSaveBase} disabled={updateSettingsMutation.isPending} className="bg-[#3f94ca] hover:bg-[#327ba8] text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all">
                            {updateSettingsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {t('saveBtn')}
                        </button>
                    </div>
                )}
            </div>

            {/* ПРЕМИУМ ХАРАКТЕРИСТИКИ */}
            <div className="bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-md p-5 sm:p-7 rounded-3xl border border-blue-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gradient-to-bl from-blue-500 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-md">
                    PRO
                </div>
                
                <h4 className="text-lg font-bold text-slate-800 mb-2">{t('premiumTitle')}</h4>
                <p className="text-sm text-slate-500 mb-6 max-w-3xl">{t('premiumDesc')}</p>

                {isLoadingPatientTraits ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                ) : (
                    <div className="flex flex-wrap gap-3 mb-6">
                        {patientTraits.length === 0 ? (
                            <span className="text-sm text-slate-400 italic bg-white/50 px-4 py-2 rounded-lg border border-dashed border-slate-300">{t('noTraits')}</span>
                        ) : (
                            patientTraits.map((link: PatientTraitLink) => (
                                <div key={link.id} className="group relative bg-white border border-slate-200 shadow-sm rounded-xl p-3 pr-10 flex flex-col min-w-[200px] max-w-[300px]">
                                    <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                                        {categoryIcons[link.trait.category]}
                                        <span className="truncate">{link.trait.name}</span>
                                    </div>
                                    {link.details && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{link.details}</div>}
                                    
                                    <button 
                                        onClick={() => removeTraitMutation.mutate(link.id)}
                                        className="absolute right-2 top-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 text-sm font-bold text-[#3f94ca] bg-blue-100 hover:bg-[#3f94ca] hover:text-white border border-[#3f94ca]/20 px-5 py-2.5 rounded-xl transition-all"
                >
                    <Plus className="w-4 h-4" /> {t('addTraitBtn')}
                </button>
            </div>

            {/* ВЫЗОВ ПОРТАЛА */}
            <TraitModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                patientId={profile.id} 
            />
        </div>
    );
}