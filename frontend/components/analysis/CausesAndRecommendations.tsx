'use client';

import { Activity, AlertTriangle, Info, CheckCircle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';

// Импортируем типы прямо из нашего хранилища
import { AICause, AIRecommendation } from '@/lib/types';

export function CausesAndRecommendations({ 
    causes, 
    recommendations 
}: { 
    causes: AICause[], 
    recommendations: AIRecommendation[] 
}) {
    const t = useTranslations('Analysis.CausesAndRecommendations');

    return (
        <div className="xl:col-span-5 space-y-6">
            {/* Светофор причин */}
            <div className="bg-white/40 backdrop-blur-md rounded-xl shadow-xl shadow-slate-200/30 border border-white/60 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-slate-700" />
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t('causesTitle')}</h2>
                </div>
                <div className="space-y-3">
                    {causes && causes.length > 0 ? causes.map((cause, idx) => {
                        // Так как severity опционален (?), undefined спокойно отработает как 'green'
                        const severityClass = 
                            cause.severity === 'red' ? 'bg-red-50/80 border-red-200/60' :
                            cause.severity === 'yellow' ? 'bg-amber-50/80 border-amber-200/60' :
                            'bg-emerald-50/80 border-emerald-200/60';
                        
                        const iconClass = 
                            cause.severity === 'red' ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
                            cause.severity === 'yellow' ? <Info className="w-4 h-4 text-amber-500" /> :
                            <CheckCircle className="w-4 h-4 text-emerald-500" />;

                        return (
                            <div key={idx} className={clsx("p-3 rounded-xl border backdrop-blur-sm transition-colors", severityClass)}>
                                <div className="flex items-start gap-2 mb-1">
                                    <div className="mt-0.5">{iconClass}</div>
                                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{cause.title}</h3>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed font-medium pl-6">{cause.description}</p>
                            </div>
                        );
                    }) : (
                        <p className="text-sm text-slate-500 italic py-2">{t('noDeviations')}</p>
                    )}
                </div>
            </div>

            {/* Рекомендации */}
            <div className="bg-white/40 backdrop-blur-md rounded-xl shadow-xl shadow-slate-200/30 border border-white/60 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-[#00be64]" />
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t('recommendationsTitle')}</h2>
                </div>
                <ul className="space-y-3">
                    {recommendations && recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-slate-800">
                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white shadow-sm border border-slate-100 text-[#3f94ca] rounded-full text-xs font-bold mt-0.5">
                                {idx + 1}
                            </span>
                            <span className="leading-relaxed font-medium">{rec.text}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}