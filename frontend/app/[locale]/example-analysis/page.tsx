'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AnalysisResponse, AIIndicator } from '@/lib/types';
import { ReasoningBlock } from '@/components/analysis/ReasoningBlock';
import { pdf } from '@react-pdf/renderer';
import { AnalysisPDF } from '@/components/analysis/AnalysisPDF';
import { downloadBlob } from '@/lib/analysis-utils';

import { 
  Activity, CheckCircle2, FileText, Loader2, User, Download, Eye, Plus, AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';

// Подключаем наш фон
import StaticBackground from '@/components/background/StaticBackground';

export default function ExampleAnalysisPage() {
  const router = useRouter();
  const t = useTranslations('ExampleAnalysis');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Собираем mock-данные прямо в компоненте, используя переводы
  const data: AnalysisResponse = {
    uid: "demo-moderate-warning",
    status: "completed",
    created_at: new Date().toISOString(),
    ai_result: {
      patient_info: {
        extracted_name: t('mockData.patientName'),
        extracted_birth_date: t('mockData.birthDate'),
        extracted_gender: t('mockData.gender')
      },
      summary: {
        is_critical: false, // Изменили на false (желтая зона)
        general_comment: t('mockData.generalComment')
      },
      reasoning: t('mockData.reasoning'),
      causes: t.raw('mockData.causes'),
      recommendations: t.raw('mockData.recommendations'),
      indicators: t.raw('mockData.indicators')
    }
  };

  const result = data.ai_result;

  if (!result) return null;

  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsGeneratingPDF(true);
    try {
      const blob = await pdf(<AnalysisPDF data={data} />).toBlob();
      downloadBlob(blob, `checkups_demo_analysis.pdf`);
    } catch (error) {
      console.error("Ошибка при генерации PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleViewOriginal = () => {
    alert(t('demoOriginalAlert'));
  };

  // const analysisDate = data.created_at ? format(new Date(data.created_at), 'd MMMM yyyy', { locale: ru }) : 'Неизвестная дата';

  return (
    <main className="relative min-h-screen pt-28 pb-16 px-4 sm:px-8 md:pt-36 md:pb-24 font-sans animate-in fade-in duration-700">
      
      <StaticBackground imageUrl="/background/analisis.png" />

      {/* Обертка контента, аналогичная реальной странице */}
      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        
        {/* --- ШАПКА АНАЛИЗА --- */}
        <div className="bg-transparent backdrop-blur-md rounded-2xl p-6 border border-white/40 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
            {/* Заменили цвет свечения на желтый/янтарный */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 pointer-events-none" />
            
            <div className="z-10 flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 md:w-6 md:h-6 text-[#3f94ca]" />
                        {t('pageTitle')}
                    </h1>
                    {/* ЖЕЛТЫЙ БЕЙДЖ ВНИМАНИЯ */}
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wide flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {t('badgeWarning')}
                    </span>
                </div>

                <p className="text-sm text-slate-600 max-w-3xl leading-relaxed mt-3">
                    {result.summary?.general_comment}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto z-10">
                <button 
                    onClick={() => router.push('/')}
                    className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 bg-[#00be64] hover:opacity-90 text-white font-medium rounded-xl transition-opacity w-full sm:w-auto shadow-sm shadow-[#00be64]/30"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t('ownAnalysisBtn')}</span>
                </button>

                <button 
                    onClick={handleViewOriginal}
                    className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 hover:bg-secondary/10 border border-secondary text-slate-700 font-medium rounded-xl transition-colors w-full sm:w-auto"
                >
                    <Eye className="w-4 h-4 text-[#3f94ca]" />
                    <span className="hidden sm:inline">{t('originalBtn')}</span>
                </button>

                <button 
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 bg-[#3f94ca] hover:opacity-90 disabled:opacity-50 text-white font-medium rounded-xl transition-opacity w-full sm:w-auto shadow-sm shadow-[#3f94ca]/30"
                >
                    {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span className="hidden sm:inline">{t('downloadPdfBtn')}</span>
                </button>
            </div>
        </div>

        {/* --- КОНТЕНТ (ЛОГИКА ИИ) --- */}
        {result.reasoning && (
            <ReasoningBlock text={result.reasoning} />
        )}

        {/* --- СЕТКА ДАННЫХ --- */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* ТАБЛИЦА ПОКАЗАТЕЛЕЙ */}
            <div className="xl:col-span-7 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-transparent backdrop-blur-md flex justify-between items-center">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                        {t('indicatorsTitle')}
                    </h2>
                    <span className="text-xs text-slate-500 font-medium">
                        {t('valuesCount', { count: result.indicators.length })}
                    </span>
                </div>
                <div className="divide-y divide-white/40">
                    {result.indicators.map((item, idx) => (
                        <IndicatorRow key={idx} item={item} t={t} />
                    ))}
                </div>
            </div>

            {/* ПРИЧИНЫ И РЕКОМЕНДАЦИИ */}
            <div className="xl:col-span-5 space-y-6">
                
                <div className="bg-transparent backdrop-blur-md rounded-xl shadow-sm p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-4">
                        {/* Иконка стала желтой/янтарной */}
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{t('causesTitle')}</h2>
                    </div>
                    <div className="space-y-3">
                        {result.causes.map((cause, idx) => (
                            // Блоки причин стали желтоватыми
                            <div key={idx} className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/40">
                                <h3 className="text-sm font-semibold text-slate-900 mb-1">{cause.title}</h3>
                                <p className="text-xs text-slate-700 leading-relaxed">{cause.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-transparent backdrop-blur-md rounded-xl shadow-sm p-4 sm:p-5 border border-amber-200 shadow-amber-500/10">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-amber-600" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t('recommendationsTitle')}</h2>
                    </div>
                    <ul className="space-y-3">
                        {result.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex gap-3 text-sm text-slate-800">
                                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold mt-0.5">
                                    {idx + 1}
                                </span>
                                <span className="leading-relaxed font-medium">{rec.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>

        {/* --- ДИСКЛЕЙМЕР ВНИЗУ --- */}
        <div className="bg-white/40 backdrop-blur-md rounded-xl shadow-sm border border-white/50 p-6 text-center mt-8">
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {/* Обернули в dangerouslySetInnerHTML для правильной работы тэга <b> если он есть, либо просто выводим текст */}
                {t('disclaimer')}
            </p>
        </div>

      </div>
    </main>
  );
}

function IndicatorRow({ item, t }: { item: AIIndicator, t: any }) {
    const isNormal = item.status === 'normal';
    
    return (
      <div className="p-4 sm:p-5 hover:bg-white/50 transition-colors group flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-sm">{item.name}</span>
            {!isNormal && (
              <span className={clsx(
                "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                item.status === 'critical' ? "bg-red-100 text-red-700 animate-pulse" : 
                item.status === 'high' ? "bg-amber-100 text-amber-700" :
                "bg-[#3f94ca]/10 text-[#3f94ca]"
              )}>
                {item.status === 'critical' ? t('statusCritical') : item.status === 'high' ? t('statusHigh') : t('statusLow')}
              </span>
            )}
          </div>
          {item.comment && !isNormal && (
              <p className={clsx(
                  "text-xs mt-1.5 leading-snug max-w-sm font-medium",
                  item.status === 'critical' ? "text-red-700" : "text-amber-700/90"
              )}>
                  {item.comment}
              </p>
          )}
          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
             {t('reference')}: {item.ref_range || "—"}
          </p>
        </div>
        
        <div className="text-right whitespace-nowrap">
            <span className={clsx(
              "text-base font-bold block",
              item.status === 'critical' ? "text-red-600" :
              item.status === 'high' ? "text-amber-600" :
              item.status === 'low' ? "text-[#3f94ca]" :
              "text-slate-600"
            )}>
              {item.value}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">{item.unit}</span>
        </div>
      </div>
    );
}