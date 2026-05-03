'use client';

import { FileText, Plus, Eye, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru, enUS, es } from 'date-fns/locale';
import { AnalysisResponse } from '@/lib/types';
import { useTranslations, useLocale } from 'next-intl';

interface AnalysisHeaderProps {
    data: AnalysisResponse;
    isViewingOriginal: boolean;
    isGeneratingPDF: boolean;
    onAddAnalysis: () => void;
    onViewOriginal: () => void;
    onDownloadPDF: () => void;
}

export function AnalysisHeader({
    data,
    isViewingOriginal,
    isGeneratingPDF,
    onAddAnalysis,
    onViewOriginal,
    onDownloadPDF
}: AnalysisHeaderProps) {
    const t = useTranslations('Analysis.Header');
    const locale = useLocale();
    const dateLocale = locale === 'ru' ? ru : locale === 'es' ? es : enUS;

    const result = data.ai_result!;

    const analysisDate = (() => {
        const extDate = result.patient_info?.extracted_date;
        let d = data.created_at ? new Date(data.created_at) : new Date();
        if (extDate) {
            const parsed = new Date(extDate);
            if (!isNaN(parsed.getTime())) {
                d = parsed;
            } else if (extDate.includes('.')) {
                const parts = extDate.split('.');
                if (parts.length === 3) {
                    const parsed2 = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    if (!isNaN(parsed2.getTime())) d = parsed2;
                }
            }
        }
        return format(d, 'd MMMM yyyy', { locale: dateLocale });
    })();

    return (
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#3f94ca]/10 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 pointer-events-none" />
            
            <div className="z-10 flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 md:w-6 md:h-6 text-[#3f94ca]" />
                        {t('title')} {analysisDate}
                    </h1>
                    {!result.summary.is_critical ? (
                        <span className="px-3 py-1 bg-[#00be64]/10 text-[#00be64] text-xs font-bold rounded-full uppercase tracking-wide">
                            {t('statusNormal')}
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wide">
                            {t('statusAttention')}
                        </span>
                    )}
                </div>
                <p className="text-sm text-slate-600 max-w-3xl leading-relaxed font-medium">
                    {result.summary.general_comment}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto z-10">
                <button 
                    onClick={onAddAnalysis} 
                    className="group flex items-center justify-center gap-2 bg-gradient-to-r from-[#3f94ca] to-[#00be64] text-white px-6 py-3 rounded-2xl hover:opacity-90 transition-all shadow-lg hover:-translate-y-0.5 font-semibold w-full sm:w-auto"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>{t('btnAdd')}</span>
                </button>
                
                <button 
                    onClick={onViewOriginal}
                    disabled={isViewingOriginal}
                    className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl transition-colors w-full sm:w-auto shadow-sm"
                >
                    {isViewingOriginal ? <Loader2 className="w-4 h-4 animate-spin text-[#3f94ca]" /> : <Eye className="w-4 h-4 text-[#3f94ca]" />}
                    <span className="hidden sm:inline">{t('btnOriginal')}</span>
                </button>

                <button 
                    onClick={onDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 bg-[#3f94ca] hover:opacity-90 disabled:opacity-50 text-white font-medium rounded-xl transition-opacity w-full sm:w-auto shadow-sm shadow-[#3f94ca]/30"
                >
                    {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span className="hidden sm:inline">{t('btnDownload')}</span>
                </button>
            </div>
        </div>
    );
}