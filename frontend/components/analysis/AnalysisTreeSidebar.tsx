'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProfiles, getPatientAnalyses, AnalysisResponse, PatientProfile } from '@/lib/api';
import { FolderOpen, User, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { clsx } from 'clsx';
import Link from 'next/link';

interface AnalysisTreeSidebarProps {
  currentId: string;
}

export function AnalysisTreeSidebar({ currentId }: AnalysisTreeSidebarProps) {
    const [isAuth, setIsAuth] = useState(false);

    // Проверяем авторизацию только на клиенте
    useEffect(() => {
        setIsAuth(!!localStorage.getItem('token'));
    }, []);

    // 1. Получаем профили
    const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery({
        queryKey: ['profiles'],
        queryFn: getProfiles,
        enabled: isAuth,
    });

    // 2. Получаем все анализы для всех профилей параллельно
    const { data: analysesMap = {}, isLoading: isLoadingAnalyses } = useQuery({
        queryKey: ['all-analyses', profiles.map(p => p.id)],
        queryFn: async () => {
            const map: Record<number, AnalysisResponse[]> = {};
            await Promise.all(profiles.map(async (p) => {
                const ans = await getPatientAnalyses(p.id);
                // Сортируем от новых к старым
                map[p.id] = ans.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
            }));
            return map;
        },
        enabled: isAuth && profiles.length > 0
    });

    const isLoading = isLoadingProfiles || isLoadingAnalyses;

    // Считаем общее количество анализов и фильтруем пустые папки по умолчанию
    const { totalAnalyses, validProfiles } = useMemo(() => {
        let total = 0;
        const valid: PatientProfile[] = [];

        for (const profile of profiles) {
            const profileAnalyses = analysesMap[profile.id] || [];
            total += profileAnalyses.length;

            const isDefaultProfile = profile.full_name === "Анализы" || profile.full_name.includes("Основной");
            
            // Если это дефолтная папка "Без привязки" и она пустая - пропускаем
            if (isDefaultProfile && profileAnalyses.length === 0) {
                continue;
            }
            
            valid.push(profile);
        }

        // Сортируем: сначала нормальные пациенты, папка "Без привязки" в конце
        valid.sort((a, b) => {
            if (a.full_name === "Анализы" || a.full_name.includes("Основной")) return 1;
            if (b.full_name === "Анализы" || b.full_name.includes("Основной")) return -1;
            return 0;
        });

        return { totalAnalyses: total, validProfiles: valid };
    }, [profiles, analysesMap]);

    // Правило: скрываем, если не авторизован или анализов меньше 2
    if (!isAuth || (!isLoading && totalAnalyses < 2)) {
        return null;
    }

    return (
        <div className="bg-white/80 backdrop-blur-md border border-white/60 shadow-lg shadow-[#3f94ca]/5 rounded-3xl p-4 sm:p-5 w-full">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 px-2">
                История расшифровок
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

// Внутренний компонент для папки
function FolderTreeItem({ profile, analyses, currentId }: { profile: PatientProfile, analyses: AnalysisResponse[], currentId: string }) {
    const isDefaultProfile = profile.full_name === "Анализы" || profile.full_name.includes("Основной");
    const hasCurrentAnalysis = analyses.some(a => a.uid === currentId);
    
    // Автоматически раскрываем папку, если в ней находится текущий открытый анализ
    const [isOpen, setIsOpen] = useState(hasCurrentAnalysis);

    return (
        <div className="flex flex-col">
            {/* Сама папка */}
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
                    {isDefaultProfile ? 'Без привязки' : profile.full_name}
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                    {analyses.length}
                </span>
            </button>

            {/* Вложенные файлы (Анимация через grid-rows) */}
            <div className={clsx(
                "grid transition-all duration-300 ease-in-out pl-6 ml-3 border-l-2",
                isOpen ? "grid-rows-[1fr] opacity-100 border-slate-200/60 mt-2" : "grid-rows-[0fr] opacity-0 border-transparent mt-0"
            )}>
                <div className="overflow-hidden flex flex-col gap-1">
                    {analyses.length === 0 ? (
                        <p className="text-xs text-slate-400 py-1 pl-2">Пусто</p>
                    ) : (
                        analyses.map(analysis => {
                            const isCurrent = analysis.uid === currentId;
                            const dateStr = analysis.created_at ? format(new Date(analysis.created_at), 'd MMM yyyy', { locale: ru }) : 'Неизвестно';
                            
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
                                    <span className="truncate">От {dateStr}</span>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}