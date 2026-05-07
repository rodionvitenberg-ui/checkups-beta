'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, X, Activity, Heart, Coffee, ShieldAlert, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { getTraits, linkPatientTrait, createCustomTrait } from '@/lib/api';
import { Trait } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { clsx } from 'clsx';

interface TraitModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number;
}

export function TraitModal({ isOpen, onClose, patientId }: TraitModalProps) {
    const t = useTranslations('Dashboard.PatientSettings');
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [mounted, setMounted] = useState(false);

    // Состояния модалки
    const [step, setStep] = useState<'select' | 'details' | 'custom'>('select');
    const [selectedTrait, setSelectedTrait] = useState<Trait | null>(null);
    const [traitDetails, setTraitDetails] = useState('');
    
    // Состояния для кастомной черты
    const [customName, setCustomName] = useState('');
    const [customCategory, setCustomCategory] = useState<Trait['category']>('feature');

    useEffect(() => {
        setMounted(true);
        // Блокируем скролл body при открытой модалке
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    const { data: allTraits = [], isLoading: isLoadingTraits } = useQuery({
        queryKey: ['traits'],
        queryFn: getTraits,
        enabled: isOpen,
    });

    const linkTraitMutation = useMutation({
        mutationFn: (traitId: number) => linkPatientTrait(patientId, traitId, traitDetails),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patientTraits', patientId] });
            resetAndClose();
            toast({ title: t('successTitle'), description: t('traitAdded'), variant: "success" });
        },
        onError: (err: any) => {
            const errorMsg = err.response?.data?.message || t('errorDesc');
            toast({ title: t('errorTitle'), description: errorMsg, variant: "destructive" });
        }
    });

    const createCustomMutation = useMutation({
        mutationFn: () => createCustomTrait(customName, customCategory),
        onSuccess: (newTrait) => {
            // После создания кастомной черты сразу привязываем её к пациенту
            linkTraitMutation.mutate(newTrait.id);
        },
        onError: () => {
            toast({ title: t('errorTitle'), description: t('errorDesc'), variant: "destructive" });
        }
    });

    const handleSave = () => {
        if (step === 'details' && selectedTrait) {
            linkTraitMutation.mutate(selectedTrait.id);
        } else if (step === 'custom' && customName.trim()) {
            createCustomMutation.mutate();
        }
    };

    const resetAndClose = () => {
        setStep('select');
        setSelectedTrait(null);
        setTraitDetails('');
        setCustomName('');
        setCustomCategory('feature');
        onClose();
    };

    const groupedTraits = allTraits.reduce((acc, trait) => {
        if (!acc[trait.category]) acc[trait.category] = [];
        acc[trait.category].push(trait);
        return acc;
    }, {} as Record<string, Trait[]>);

    const categoryIcons: Record<string, any> = {
        disease: <Activity className="w-4 h-4 text-red-500" />,
        bad_habit: <ShieldAlert className="w-4 h-4 text-orange-500" />,
        good_habit: <Heart className="w-4 h-4 text-green-500" />,
        feature: <Coffee className="w-4 h-4 text-blue-500" />
    };

    if (!mounted || !isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                
                {/* ШАПКА */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xl font-bold text-slate-800">
                        {step === 'select' && t('modalSelectTitle')}
                        {step === 'details' && t('modalDetailsTitle')}
                        {step === 'custom' && t('modalCustomTitle', { fallback: 'Своя характеристика' })}
                    </h3>
                    <button onClick={resetAndClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ТЕЛО */}
                <div className="p-5 overflow-y-auto flex-1">
                    {step === 'select' && (
                        isLoadingTraits ? (
                            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#3f94ca]" /></div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(groupedTraits).map(([category, traits]) => (
                                    <div key={category}>
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            {categoryIcons[category]} {t(`categories.${category}`)}
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {traits.map(trait => (
                                                <button 
                                                    key={trait.id}
                                                    onClick={() => { setSelectedTrait(trait); setStep('details'); }}
                                                    className="text-sm px-4 py-2 bg-slate-100 hover:bg-[#3f94ca] hover:text-white text-slate-700 rounded-xl transition-colors text-left"
                                                >
                                                    {trait.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                
                                {/* КНОПКА КАСТОМНОЙ ЧЕРТЫ */}
                                <div className="pt-4 border-t border-slate-100 flex justify-center">
                                    <button 
                                        onClick={() => setStep('custom')}
                                        className="text-sm font-semibold text-[#3f94ca] hover:text-white hover:bg-[#3f94ca] border border-[#3f94ca] px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {t('createCustomBtn', { fallback: 'Нет в списке? Добавить свое' })}
                                    </button>
                                </div>
                            </div>
                        )
                    )}

                    {step === 'details' && selectedTrait && (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-800 rounded-2xl border border-blue-100 mb-6">
                                {categoryIcons[selectedTrait.category]}
                                <span className="font-bold text-lg">{selectedTrait.name}</span>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">{t('detailsLabel')}</label>
                                <textarea
                                    autoFocus rows={4} placeholder={t('detailsPlaceholder')}
                                    value={traitDetails} onChange={(e) => setTraitDetails(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#3f94ca] focus:ring-2 focus:ring-[#3f94ca]/20 rounded-xl p-4 outline-none resize-none"
                                />
                                <p className="text-xs text-slate-400 ml-1">{t('detailsHint')}</p>
                            </div>
                        </div>
                    )}

                    {step === 'custom' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">{t('customNameLabel', { fallback: 'Название' })}</label>
                                <input
                                    autoFocus type="text" placeholder={t('customNamePlaceholder', { fallback: 'Например: Пью протеин' })}
                                    value={customName} onChange={(e) => setCustomName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#3f94ca] focus:ring-2 focus:ring-[#3f94ca]/20 rounded-xl px-4 py-2.5 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">{t('customCategoryLabel', { fallback: 'Категория' })}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.keys(categoryIcons) as Array<Trait['category']>).map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setCustomCategory(cat)}
                                            className={clsx(
                                                "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
                                                customCategory === cat 
                                                    ? "bg-blue-50 border-blue-200 text-blue-700" 
                                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                            )}
                                        >
                                            {categoryIcons[cat]} {t(`categories.${cat}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">{t('detailsLabel')}</label>
                                <textarea
                                    rows={3} placeholder={t('detailsPlaceholder')}
                                    value={traitDetails} onChange={(e) => setTraitDetails(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#3f94ca] focus:ring-2 focus:ring-[#3f94ca]/20 rounded-xl p-4 outline-none resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ПОДВАЛ / КНОПКИ */}
                {step !== 'select' && (
                    <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-between">
                        <button onClick={() => setStep('select')} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                            {t('backBtn')}
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={linkTraitMutation.isPending || createCustomMutation.isPending || (step === 'custom' && !customName.trim())}
                            className="px-6 py-2.5 bg-[#3f94ca] hover:bg-[#327ba8] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#3f94ca]/30 transition-all flex items-center gap-2 disabled:opacity-70"
                        >
                            {(linkTraitMutation.isPending || createCustomMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {t('saveTraitBtn')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}