'use client';

import { useState } from 'react';
import { 
    User, Check, Edit2, X, ChevronDown, 
    List, Activity, Loader2, Trash2, FileText, AlertCircle, Settings 
} from 'lucide-react';
import { clsx } from 'clsx';
import { useToast } from '@/components/ui/toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PatientChart } from '@/components/dashboard/PatientChart';
import { AnalysisItem } from './AnalysisItem'; 
import { useTranslations } from 'next-intl';
import { PatientSettings } from './PatientSettings';

// ИМПОРТЫ API
import { 
    getPatientAnalyses, 
    getPatientHistory, 
    updateProfile, 
    deleteProfile 
} from '@/lib/api';

// ИМПОРТЫ ТИПОВ
import { PatientProfile, AnalysisResponse } from '@/lib/types';

export function ProfileCard({ profile, isExpanded, onToggle }: { profile: PatientProfile, isExpanded: boolean, onToggle: () => void }) {
    const [activeTab, setActiveTab] = useState<'history' | 'dynamics' | 'settings'>('history');
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(profile.full_name);
    
    // НОВОЕ СОСТОЯНИЕ: контроль модалки удаления
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const t = useTranslations('Dashboard.ProfileCard');

    // Оставляем только для того, чтобы скрывать кнопку удаления для дефолтных имен и менять описание
    const isDefaultProfile = profile.full_name === "Анализы" || profile.full_name.includes("Основной") || profile.full_name === "Мой профиль";

    const { data: analyses = [], isLoading: isLoadingAnalyses } = useQuery({
        queryKey: ['analyses', profile.id],
        queryFn: () => getPatientAnalyses(profile.id),
        enabled: isExpanded,
    });

    const { data: history = [], isLoading: isLoadingHistory } = useQuery({
        queryKey: ['history', profile.id],
        queryFn: () => getPatientHistory(profile.id),
        enabled: isExpanded, // Теперь графики грузятся для ВСЕХ профилей
    });

    const updateNameMutation = useMutation({
        mutationFn: (newName: string) => updateProfile(profile.id, { full_name: newName }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            setIsEditing(false);
            toast({ title: t('toasts.successRenameTitle'), description: t('toasts.successRenameDesc'), variant: "success" });
        },
        onError: () => toast({ title: t('toasts.errorRenameTitle'), description: t('toasts.errorRenameDesc'), variant: "destructive" })
    });

    const handleSaveName = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        if (editName.trim() && editName !== profile.full_name) {
            updateNameMutation.mutate(editName.trim());
        } else {
            setIsEditing(false); 
        }
    };

    const deleteProfileMutation = useMutation({
        mutationFn: (id: number) => deleteProfile(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            toast({ title: t('toasts.successDeleteTitle'), description: t('toasts.successDeleteDesc'), variant: "success" });
            setShowDeleteConfirm(false);
        },
        onError: () => {
            toast({ title: t('toasts.errorDeleteTitle'), description: t('toasts.errorDeleteDesc'), variant: "destructive" });
            setShowDeleteConfirm(false);
        }
    });

    const isLoadingData = isLoadingAnalyses || isLoadingHistory;

    return (
        <>
            <div className={clsx(
                "bg-white/70 backdrop-blur-md rounded-3xl transition-all duration-500 overflow-hidden",
                isExpanded 
                    ? "border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-[#3f94ca]/20"
                    : "border border-white/40 shadow-sm hover:border-[#3f94ca]/40 hover:bg-white/80 hover:shadow-md"
            )}>
                {/* ШАПКА КАРТОЧКИ */}
                <div 
                    onClick={() => { if (!isEditing) onToggle(); setActiveTab('history'); }}
                    className={clsx(
                        "w-full flex items-center justify-between p-6 sm:p-6 text-left group cursor-pointer transition-colors",
                        isExpanded ? "bg-[#3f94ca]/5" : "bg-transparent"
                    )}
                    role="button"
                >
                    <div className="flex items-center gap-4 sm:gap-5 w-full overflow-hidden">
                        
                        {/* ИКОНКА / КНОПКА РЕДАКТИРОВАНИЯ (Теперь единая для всех) */}
                        <div className={clsx(
                            "w-10 h-10 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-lg transition-all duration-300 shrink-0",
                            isExpanded 
                                ? "bg-gradient-to-br from-[#3f94ca] to-secondary text-white scale-100" 
                                : "bg-white/60 text-slate-500 group-hover:bg-[#3f94ca]/10 group-hover:text-[#3f94ca]",
                            isEditing && "max-sm:!bg-gradient-to-br max-sm:!from-[#00be64] max-sm:!to-[#00a859] max-sm:!text-white max-sm:!shadow-lg max-sm:!shadow-[#00be64]/30 max-sm:!scale-100"
                        )}>
                            <User className="hidden sm:block w-6 h-6 sm:w-7 sm:h-7" />
                            
                            <div 
                                className="sm:hidden w-full h-full flex items-center justify-center"
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    if (isEditing) {
                                        handleSaveName(e);
                                    } else {
                                        setIsEditing(true);
                                        setEditName(profile.full_name);
                                    }
                                }}
                            >
                                {updateNameMutation.isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : isEditing ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <Edit2 className="w-5 h-5" />
                                )}
                            </div>
                        </div>
                        
                        {/* ТЕКСТ / ПОЛЕ ВВОДА */}
                        <div className="flex-1 overflow-hidden">
                            {isEditing ? (
                                <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                                    <input 
                                        type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                                        className="border-b-2 border-[#3f94ca] bg-white/50 text-base sm:text-lg font-bold text-slate-900 focus:outline-none py-1 px-2 w-full sm:min-w-[200px] rounded-t-md"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveName(e);
                                            if (e.key === 'Escape') setIsEditing(false);
                                        }}
                                    />
                                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                                        <button onClick={handleSaveName} className="p-1.5 bg-[#00be64]/20 text-[#00be64] rounded-lg hover:bg-[#00be64]/30 transition-colors">
                                            {updateNameMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="p-1.5 bg-slate-200/50 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight truncate">
                                        {profile.full_name}
                                    </h3>
                                    {/* Кнопка переименования теперь доступна ВСЕМ профилям */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditName(profile.full_name); }}
                                        className="hidden sm:block p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-[#3f94ca] hover:bg-[#3f94ca]/10 rounded-xl transition-all shrink-0"
                                        title={t('titles.rename')}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div className="text-xs sm:text-sm text-slate-500 mt-1 font-medium truncate">
                                {isDefaultProfile ? t('defaultDesc') : t('patientDesc')}
                            </div>
                        </div>
                    </div>

                    {/* СТРЕЛОЧКА РАЗВОРОТА */}
                    {!isEditing && (
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ml-2",
                            isExpanded ? "bg-white shadow-sm" : "bg-white/50 group-hover:bg-white"
                        )}>
                            <ChevronDown className={clsx("w-5 h-5 text-slate-400 transition-transform duration-300", isExpanded && "rotate-180 text-[#3f94ca]")} />
                        </div>
                    )}
                </div>

                {/* КОНТЕНТ КАРТОЧКИ */}
                <div className={clsx(
                    "transition-all duration-500 ease-in-out border-t border-white/40 relative",
                    isExpanded ? "max-h-[2000px] opacity-100 bg-white/40" : "max-h-0 opacity-0"
                )}>
                    <div className="p-5 sm:p-6">
                        <div className="flex flex-wrap gap-4 sm:gap-6 mb-6 border-b border-white/60">
                            <button onClick={() => setActiveTab('history')} className={clsx("pb-3 text-sm font-semibold transition-all flex items-center gap-2 relative", activeTab === 'history' ? "text-[#3f94ca]" : "text-slate-500 hover:text-slate-800")}>
                                <List className="w-4 h-4" /> {t('tabHistory')}
                                {activeTab === 'history' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#3f94ca] rounded-t-full" />}
                            </button>
                            
                            {/* Вкладка динамики теперь доступна ВСЕМ */}
                            <button onClick={() => setActiveTab('dynamics')} className={clsx("pb-3 text-sm font-semibold transition-all flex items-center gap-2 relative", activeTab === 'dynamics' ? "text-[#3f94ca]" : "text-slate-500 hover:text-slate-800")}>
                                <Activity className="w-4 h-4" /> {t('tabDynamics')}
                                {activeTab === 'dynamics' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#3f94ca] rounded-t-full" />}
                            </button>

                            <button onClick={() => setActiveTab('settings')} className={clsx("pb-3 text-sm font-semibold transition-all flex items-center gap-2 relative", activeTab === 'settings' ? "text-[#3f94ca]" : "text-slate-500 hover:text-slate-800")}>
                                <Settings className="w-4 h-4" /> {t('tabSettings', { fallback: 'Параметры' })}
                                {activeTab === 'settings' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#3f94ca] rounded-t-full" />}
                            </button>
                        </div>

                        {isLoadingData ? (
                            <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 text-[#3f94ca]/50 animate-spin" /></div>
                        ) : (
                            <>
                                {activeTab === 'history' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        {analyses.length === 0 ? (
                                            <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-slate-300">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <FileText className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="text-slate-500 font-medium">{t('emptyHistory')}</p>
                                            </div>
                                        ) : (
                                            analyses.map((analysis: AnalysisResponse) => (
                                                <AnalysisItem 
                                                    key={analysis.uid} analysis={analysis} 
                                                    onDeleteSuccess={() => queryClient.invalidateQueries({ queryKey: ['analyses', profile.id] })} 
                                                />
                                            ))
                                        )}
                                    </div>
                                )}
                                
                                {/* Графики теперь отрисовываются для ВСЕХ профилей */}
                                {activeTab === 'dynamics' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 bg-white/80 backdrop-blur-md p-5 sm:p-7 rounded-3xl border border-white/60 shadow-sm">
                                        <PatientChart history={history} />
                                    </div>
                                )}

                                {activeTab === 'settings' && (
                                    <PatientSettings profile={profile} />
                                )}
                            </>
                        )}

                        {/* Кнопка удаления скрыта только для базовых имен профиля для безопасности UI */}
                        {!isDefaultProfile && (
                            <div className="mt-8 pt-5 border-t border-white/60 flex justify-end">
                                <button 
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={deleteProfileMutation.isPending}
                                    className="text-xs sm:text-sm text-slate-400 hover:text-red-500 font-medium flex items-center gap-1.5 hover:bg-red-50/50 px-4 py-2 rounded-xl transition-all"
                                >
                                    {deleteProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} {t('deleteButton')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 p-6 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t('deleteModalTitle')}</h3>
                        <p className="text-slate-500 mb-6 text-sm">
                            {t('confirmDelete')}
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleteProfileMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-70"
                            >
                                {t('cancelBtn')}
                            </button>
                            <button 
                                onClick={() => deleteProfileMutation.mutate(profile.id)}
                                disabled={deleteProfileMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {deleteProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('confirmDeleteBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}