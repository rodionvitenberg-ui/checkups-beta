'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/routing';
import { Loader2, RefreshCw, Settings2, X, Save, ShieldAlert, Heart, Coffee, Activity, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';

// API и типы
import { getProfiles, updateProfile, getPatientTraits, removePatientTrait, reanalyzeDocument } from '@/lib/api';
import { AnalysisResponse, PatientProfile, PatientTraitLink } from '@/lib/types';
import { TraitModal } from '@/components/dashboard/TraitModal';

export function RefineAnalysisBlock({ analysis }: { analysis: AnalysisResponse }) {
    const t = useTranslations('Analysis.RefineBlock');
    const router = useRouter();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [mounted, setMounted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTraitModalOpen, setIsTraitModalOpen] = useState(false);
    
    // Блокировка скролла и гидратация для портала
    useEffect(() => {
        setMounted(true);
        if (isModalOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isModalOpen]);

    const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery({
        queryKey: ['profiles'],
        queryFn: getProfiles,
        enabled: !!analysis.patient_profile_id,
    });

    const currentProfile = profiles.find(p => p.id === analysis.patient_profile_id);

    const [formData, setFormData] = useState({
        gender: '',
        birth_date: '',
        weight: '',
        height: '',
    });

    useEffect(() => {
        if (currentProfile) {
            setFormData({
                gender: currentProfile.gender || '',
                birth_date: currentProfile.birth_date || '',
                weight: currentProfile.weight?.toString() || '',
                height: currentProfile.height?.toString() || '',
            });
        }
    }, [currentProfile]);

    const { data: patientTraits = [], isLoading: isLoadingTraits } = useQuery({
        queryKey: ['patientTraits', currentProfile?.id],
        queryFn: () => getPatientTraits(currentProfile!.id),
        enabled: !!currentProfile,
    });

    // --- МУТАЦИИ ---
    const saveProfileMutation = useMutation({
        mutationFn: (data: Partial<PatientProfile>) => updateProfile(currentProfile!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            toast({ title: t('savedTitle'), description: t('savedDesc'), variant: "success" });
        }
    });

    const removeTraitMutation = useMutation({
        mutationFn: (linkId: number) => removePatientTrait(linkId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patientTraits', currentProfile?.id] });
        }
    });

    const reanalyzeMutation = useMutation({
        mutationFn: () => reanalyzeDocument(analysis.uid),
        onSuccess: (newAnalysis) => {
            setIsModalOpen(false);
            toast({ title: t('reanalyzeSuccessTitle'), description: t('reanalyzeSuccessDesc'), variant: "success" });
            router.push(`/analysis/${newAnalysis.uid}`);
        },
        onError: () => {
            toast({ title: t('errorTitle'), description: t('errorDesc'), variant: "destructive" });
        }
    });

    const handleSaveBase = async () => {
        if (!currentProfile) return;
        const payload: Partial<PatientProfile> = {
            gender: (formData.gender as 'M' | 'F') || null,
            birth_date: formData.birth_date || null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            height: formData.height ? parseFloat(formData.height) : null,
        };
        await saveProfileMutation.mutateAsync(payload);
    };

    const hasChanges = currentProfile && (
        String(formData.weight || '') !== String(currentProfile.weight || '') ||
        String(formData.height || '') !== String(currentProfile.height || '') ||
        String(formData.gender || '') !== String(currentProfile.gender || '') ||
        String(formData.birth_date || '') !== String(currentProfile.birth_date || '')
    );

    const categoryIcons: Record<string, any> = {
        disease: <Activity className="w-3 h-3 text-red-500" />,
        bad_habit: <ShieldAlert className="w-3 h-3 text-orange-500" />,
        good_habit: <Heart className="w-3 h-3 text-green-500" />,
        feature: <Coffee className="w-3 h-3 text-blue-500" />
    };

    if (!analysis.patient_profile_id) return null;
    if (isLoadingProfiles) return <div className="w-full h-24 bg-white/40 animate-pulse rounded-2xl" />;

    // --- ПОРТАЛ ОСНОВНОЙ МОДАЛКИ ---
    const modalContent = isModalOpen && currentProfile && mounted ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{t('modalTitle')}</h3>
                        <p className="text-xs text-slate-500">{t('modalSubtitle')} ({currentProfile.full_name})</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 space-y-6">
                    
                    {/* БАЗОВЫЕ ПАРАМЕТРЫ */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-slate-800">{t('baseParams')}</h4>
                            {hasChanges && (
                                <button onClick={handleSaveBase} disabled={saveProfileMutation.isPending} className="text-xs font-bold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all">
                                    {saveProfileMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    {t('saveParams')}
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">{t('gender')}</label>
                                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-50 border border-slate-200 focus:border-[#3f94ca] rounded-lg px-3 py-2 text-sm outline-none">
                                    <option value="">{t('notSelected')}</option>
                                    <option value="M">{t('male')}</option>
                                    <option value="F">{t('female')}</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">{t('dob')}</label>
                                <input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 focus:border-[#3f94ca] rounded-lg px-3 py-2 text-sm outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">{t('height')}</label>
                                <input type="number" placeholder="175" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full bg-slate-50 border border-slate-200 focus:border-[#3f94ca] rounded-lg px-3 py-2 text-sm outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">{t('weight')}</label>
                                <input type="number" step="0.1" placeholder="70.5" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full bg-slate-50 border border-slate-200 focus:border-[#3f94ca] rounded-lg px-3 py-2 text-sm outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* ПРЕМИУМ ХАРАКТЕРИСТИКИ */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 p-5 rounded-2xl border border-blue-100 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-800 mb-3">{t('healthTraits')}</h4>
                        
                        {isLoadingTraits ? (
                            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
                        ) : (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {patientTraits.length === 0 ? (
                                    <span className="text-xs text-slate-400 italic bg-white/50 px-3 py-1.5 rounded-md border border-dashed border-slate-300">{t('noTraits')}</span>
                                ) : (
                                    patientTraits.map((link: PatientTraitLink) => (
                                        <div key={link.id} className="group relative bg-white border border-slate-200 shadow-sm rounded-lg py-1.5 px-3 pr-8 flex items-center gap-2 max-w-full">
                                            {categoryIcons[link.trait.category]}
                                            <span className="text-xs font-semibold text-slate-700 truncate">{link.trait.name}</span>
                                            <button onClick={() => removeTraitMutation.mutate(link.id)} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        
                        <button onClick={() => setIsTraitModalOpen(true)} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors">
                            <Plus className="w-3 h-3" /> {t('addTraitBtn')}
                        </button>
                    </div>
                    
                </div>

                {/* ПОДВАЛ И КНОПКА ЗАПУСКА */}
                <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
                        {t('reanalyzeWarning')}
                    </p>
                    <button 
                        onClick={() => reanalyzeMutation.mutate()}
                        disabled={reanalyzeMutation.isPending || hasChanges}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {reanalyzeMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        {hasChanges ? t('saveBeforeReanalyze') : t('startReanalyzeBtn')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            {/* КАРТОЧКА В САЙДБАРЕ */}
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-5 border border-blue-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-gradient-to-bl from-blue-500 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-md">
                    PRO
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-blue-600" /> {t('cardTitle')}
                </h4>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    {t('cardDesc')}
                </p>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-blue-600 hover:text-white text-blue-600 text-sm font-bold border border-blue-200 hover:border-blue-600 rounded-xl transition-all shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" /> {t('openModalBtn')}
                </button>
            </div>

            {/* РЕНДЕР ПОРТАЛОВ */}
            {modalContent}

            <TraitModal 
                isOpen={isTraitModalOpen} 
                onClose={() => setIsTraitModalOpen(false)} 
                patientId={currentProfile?.id || 0} 
            />
        </>
    );
}