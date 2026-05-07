'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProfiles, getPatientAnalyses } from '@/lib/api';
import { AnalysisResponse, PatientProfile } from '@/lib/types';
import { FolderOpen, User, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru, enUS, es } from 'date-fns/locale';
import { clsx } from 'clsx';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

interface AnalysisTreeSidebarProps {
  currentId: string;
}

export function AnalysisTreeSidebar({ currentId }: AnalysisTreeSidebarProps) {
    const t = useTranslations('TreeSidebar');
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        setIsAuth(!!localStorage.getItem('token'));
    }, []);

    const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery({
        queryKey: ['profiles'],
        queryFn: getProfiles,
        enabled: isAuth,
    });

    const { data: analysesMap = {}, isLoading: isLoadingAnalyses } = useQuery({
        queryKey: ['all-analyses', profiles.map(p => p.id)],
        queryFn: async () => {
            const map: Record<number, AnalysisResponse[]> = {};
            await Promise.all(profiles.map(async (p) => {
                const ans = await getPatientAnalyses(p.id);
                map[p.id] = ans.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
            }));
            return map;
        },
        enabled: isAuth && profiles.length > 0
    });

    const isLoading = isLoadingProfiles || isLoadingAnalyses;

    const { totalAnalyses, validProfiles } = useMemo(() => {
        let total = 0;
        const valid: PatientProfile[] = [];

        for (const profile of profiles) {
            const profileAnalyses = analysesMap[profile.id] || [];
            total += profileAnalyses.length;

            // Расширили проверку, чтобы захватить и старые, и новые дефолтные имена
            const isDefaultProfile = profile.full_name === "Анализы" || profile.full_name.includes("Основной") || profile.full_name.includes("Мой");
            
            if (isDefaultProfile && profileAnalyses.length === 0) {
                continue;
            }
            
            valid.push(profile);
        }

        valid.sort((a, b) => {
            const aIsDefault = a.full_name === "Анализы" || a.full_name.includes("Основной") || a.full_name.includes("Мой");
            const bIsDefault = b.full_name === "Анализы" || b.full_name.includes("Основной") || b.full_name.includes("Мой");
            
            if (aIsDefault) return 1;
            if (bIsDefault) return -1;
            return 0;
        });

        return { totalAnalyses: total, validProfiles: valid };
    }, [profiles, analysesMap]);

    if (!isAuth || (!isLoading && totalAnalyses < 2)) {
        return null;
    }

    return (
        <div className="bg-white/80 backdrop-blur-md border border-white/60 shadow-lg shadow-[#3f94ca]/5 rounded-3xl p-4 sm:p-5 w-full">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 px-2">
                {t('title')}
            </h3>

            {isLoading ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 text-[#3f94ca] animate-spin" />
                </div>
            ) : (
                <div className="space-y-2">
                    {validProfiles.map(profile => (
                        <FolderTreeItem 
                            key={profile.id} 
                            profile={profile} 
                            analyses={analysesMap[profile.id] || []} 
                            currentId={currentId} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// --- ВНУТРЕННИЙ КОМПОНЕНТ ---
function FolderTreeItem({ profile, analyses, currentId }: { profile: PatientProfile, analyses: AnalysisResponse[], currentId: string }) {
    const t = useTranslations('TreeSidebar');
    const locale = useLocale();
    
    // Подбираем правильную локаль для date-fns в зависимости от языка приложения
    const dateLocale = locale === 'ru' ? ru : locale === 'es' ? es : enUS;

    const isDefaultProfile = profile.full_name === "Анализы" || profile.full_name.includes("Основной") || profile.full_name.includes("Мой");
    const hasCurrentAnalysis = analyses.some(a => a.uid === currentId);
    
    const [isOpen, setIsOpen] = useState(hasCurrentAnalysis);

    return (
        <div className="flex flex-col">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "flex items-center w-full gap-2.5 p-2 rounded-xl transition-colors text-left group hover:bg-white/50",
                    isOpen ? "bg-white/50" : "bg-transparent"
                )}
            >
                <ChevronRight className={clsx("w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300", isOpen && "rotate-90")} />
                <div className={clsx(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    hasCurrentAnalysis ? "bg-[#3f94ca] text-white" : "bg-slate-100 text-slate-500 group-hover:bg-[#3f94ca]/10 group-hover:text-[#3f94ca]"
                )}>
                    {isDefaultProfile ? <FolderOpen className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <span className="text-sm font-bold text-slate-800 truncate flex-1">
                    {isDefaultProfile ? t('unassigned') : profile.full_name}
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                    {analyses.length}
                </span>
            </button>

            <div className={clsx(
                "grid transition-all duration-300 ease-in-out pl-6 ml-3 border-l-2",
                isOpen ? "grid-rows-[1fr] opacity-100 border-slate-200/60 mt-2" : "grid-rows-[0fr] opacity-0 border-transparent mt-0"
            )}>
                <div className="overflow-hidden flex flex-col gap-1">
                    {analyses.length === 0 ? (
                        <p className="text-xs text-slate-400 py-1 pl-2">{t('empty')}</p>
                    ) : (
                        analyses.map(analysis => {
                            const isCurrent = analysis.uid === currentId;
                            
                            // --- НОВАЯ ЛОГИКА ОПРЕДЕЛЕНИЯ ДАТЫ ---
                            let dateStr = t('unknownDate');
                            
                            // 1. Сначала пытаемся взять реальную дату анализа из результатов ИИ
                            if (analysis.ai_result?.patient_info?.extracted_date) {
                                // Берем дату (отсекаем время, если ИИ вернул "30.10.2025 08:23")
                                dateStr = analysis.ai_result.patient_info.extracted_date.split(' ')[0];
                            } 
                            // 2. Если ИИ не нашел дату, берем дату загрузки файла (фолбэк)
                            else if (analysis.created_at) {
                                dateStr = format(new Date(analysis.created_at), 'd MMM yyyy', { locale: dateLocale });
                            }
                            // -------------------------------------
                            
                            return (
                                <Link 
                                    key={analysis.uid} 
                                    href={`/analysis/${analysis.uid}`}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                                        isCurrent 
                                            ? "bg-[#3f94ca]/10 text-[#3f94ca]" 
                                            : "text-slate-600 hover:bg-slate-100/60 hover:text-slate-900"
                                    )}
                                >
                                    <FileText className={clsx("w-3.5 h-3.5 shrink-0", isCurrent ? "text-[#3f94ca]" : "text-slate-400")} />
                                    <span className="truncate">{t('datePrefix', { date: dateStr })}</span>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}