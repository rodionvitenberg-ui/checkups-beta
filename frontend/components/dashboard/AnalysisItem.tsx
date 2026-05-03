'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { FileText, ArrowRight, Eye, Download, Trash2, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { ru, enUS, es } from 'date-fns/locale';
import { useToast } from '@/components/ui/toast';
import { viewOriginalFile, deleteAnalysis } from '@/lib/api';
import { AnalysisResponse } from '@/lib/types';
import { pdf } from '@react-pdf/renderer';
import { AnalysisPDF } from '@/components/analysis/AnalysisPDF';
import { useTranslations, useLocale } from 'next-intl';

export function AnalysisItem({ analysis, onDeleteSuccess }: { analysis: AnalysisResponse, onDeleteSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [viewing, setViewing] = useState(false);
    const { toast } = useToast();
    const t = useTranslations('Dashboard.AnalysisItem');
    const locale = useLocale();

    // Динамически подбираем локаль для date-fns
    const dateLocale = locale === 'ru' ? ru : locale === 'es' ? es : enUS;

    const handleDownloadPDF = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!analysis.ai_result) {
            toast({ title: t('toasts.warningTitle'), description: t('toasts.pdfNotReady'), variant: "warning" });
            return;
        }
        setDownloading(true);
        try {
            const blob = await pdf(<AnalysisPDF data={analysis} />).toBlob();
            const dateStr = new Date(analysis.created_at || Date.now()).toISOString().split('T')[0];
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Checkups_Report_${dateStr}.pdf`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            toast({ title: t('toasts.errorTitle'), description: t('toasts.pdfError'), variant: "destructive" });
        } finally {
            setDownloading(false);
        }
    };

    const handleViewOriginal = async (e: React.MouseEvent) => {
        const newWindow = window.open('', '_blank');
        
        e.preventDefault(); 
        e.stopPropagation();
        
        setViewing(true);
        try {
            const fileUrl = await viewOriginalFile(analysis.uid);
            
            if (newWindow) {
                newWindow.location.href = fileUrl;
            } else {
                window.location.href = fileUrl;
            }
            
            setTimeout(() => URL.revokeObjectURL(fileUrl), 10000);
        } catch (error) {
            if (newWindow) newWindow.close();
            toast({ title: t('toasts.errorTitle'), description: t('toasts.viewError'), variant: "destructive" });
        } finally {
            setViewing(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!window.confirm(t('confirmDelete'))) return;
        setLoading(true);
        try {
            await deleteAnalysis(analysis.uid);
            toast({ title: t('toasts.successTitle'), description: t('toasts.deleteSuccess'), variant: "success" });
            onDeleteSuccess(); 
        } catch (error) {
            toast({ title: t('toasts.errorTitle'), description: t('toasts.deleteError'), variant: "destructive" });
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl hover:border-secondary hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 mb-3 group">
            
            <Link href={`/analysis/${analysis.uid}`} className="flex items-center gap-4 flex-1 cursor-pointer">
                <div className={clsx(
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0",
                    analysis.status === 'completed' ? "bg-gradient-to-br from-[#00be64]/10 to-[#00be64]/20 text-[#00be64]" :
                    analysis.status === 'processing' ? "bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-600" :
                    "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-500"
                )}>
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[#3f94ca] transition-colors">
                        {analysis.ai_result?.patient_info?.extracted_name 
                            ? `${analysis.ai_result.patient_info.extracted_name} ${t('from')} ` 
                            : `${t('defaultName')} ${t('from')} `}
                        {(() => {
                            const extDate = analysis.ai_result?.patient_info?.extracted_date;
                            let d = analysis.created_at ? new Date(analysis.created_at) : new Date();
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
                        })()}
                    </h4>
                    <span className={clsx(
                        "text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block",
                        analysis.status === 'completed' ? "bg-[#00be64]/10 text-[#00be64]" : "bg-yellow-50 text-yellow-600"
                    )}>
                        {analysis.status === 'completed' ? t('status.completed') : t('status.processing')}
                    </span>
                </div>
            </Link>

            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {analysis.status === 'completed' && (
                    <Link href={`/analysis/${analysis.uid}`} className="p-2 text-slate-400 hover:text-[#3f94ca] hover:bg-[#3f94ca]/10 rounded-xl transition-colors" title={t('titles.open')}>
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                )}
                <button 
                    type="button" 
                    onClick={handleViewOriginal} 
                    disabled={viewing} 
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 rounded-xl transition-colors" 
                    title={t('titles.viewOriginal')}
                >
                    {viewing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                </button>
                {analysis.status === 'completed' && (
                    <button onClick={handleDownloadPDF} disabled={downloading} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-colors" title={t('titles.downloadPDF')}>
                        {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    </button>
                )}
                <button onClick={handleDelete} disabled={loading} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-colors" title={t('titles.delete')}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
}