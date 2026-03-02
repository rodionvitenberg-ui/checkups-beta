'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAnalysisResult, viewOriginalFile, AnalysisResponse, AIIndicator } from '@/lib/api';
import { ReasoningBlock } from '@/components/analysis/ReasoningBlock';
import { pdf } from '@react-pdf/renderer';
import { AnalysisPDF } from '@/components/analysis/AnalysisPDF';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { 
  Activity, CheckCircle2, FileText, Loader2, User, Download, Eye, BrainCircuit, Plus
} from 'lucide-react';
import { clsx } from 'clsx';

// ИМПОРТИРУЕМ НОВЫЙ КОМПОНЕНТ САЙДБАРА
import { AnalysisTreeSidebar } from '@/components/analysis/AnalysisTreeSidebar';
import StaticBackground from '@/components/background/StaticBackground';

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isViewingOriginal, setIsViewingOriginal] = useState(false);

  // --- Состояния для интерактивного лоадера ---
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Подготовка к анализу...");

  // Основной useEffect для поллинга бэкенда
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const fetchStatus = async () => {
      try {
        const result = await getAnalysisResult(id);
        setData(result);
        if (result.status === 'completed' || result.status === 'failed') {
          setIsPolling(false);
          setProgress(100); 
          clearInterval(intervalId);
        }
      } catch (error) { console.error(error); }
    };
    fetchStatus();
    if (isPolling) intervalId = setInterval(fetchStatus, 3000);
    return () => clearInterval(intervalId);
  }, [id, isPolling]);

  // useEffect для "фейковой" анимации
  useEffect(() => {
    if (!isPolling) return;

    const texts = [
        "Распознавание документа...",
        "Извлечение медицинских показателей...",
        "Анализ полученных данных ИИ...",
        "Поиск возможных причин...",
        "Формируются выводы и рекомендации...",
        "Почти готово..."
    ];

    let currentProgress = 0;
    const progressInterval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 3) + 2; 
        if (currentProgress > 95) currentProgress = 98; 
        setProgress(currentProgress);

        if (currentProgress < 15) setLoadingText(texts[0]);
        else if (currentProgress < 35) setLoadingText(texts[1]);
        else if (currentProgress < 55) setLoadingText(texts[2]);
        else if (currentProgress < 75) setLoadingText(texts[3]);
        else if (currentProgress < 90) setLoadingText(texts[4]);
        else setLoadingText(texts[5]);

    }, 1500);

    return () => clearInterval(progressInterval);
  }, [isPolling]);

  const handleDownloadPDF = async () => {
    if (!data) return;
    setIsGeneratingPDF(true);
    try {
      const blob = await pdf(<AnalysisPDF data={data!} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Checkups_Report_${id.slice(0, 8)}.pdf`;
      
      link.style.display = 'none'; 
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);

    } catch (error) {
      console.error("Ошибка при генерации PDF:", error);
      alert("Не удалось сгенерировать PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleViewOriginal = async () => {
    const newWindow = window.open('', '_blank');
    setIsViewingOriginal(true);
    try {
      const fileUrl = await viewOriginalFile(id); 
      if (newWindow) {
        newWindow.location.href = fileUrl; 
      } else {
        window.location.href = fileUrl; 
      }
      setTimeout(() => URL.revokeObjectURL(fileUrl), 10000);
    } catch (error) {
      console.error("Ошибка открытия оригинала:", error);
      if (newWindow) newWindow.close(); 
      alert("Не удалось загрузить исходный файл.");
    } finally {
      setIsViewingOriginal(false);
    }
  };

  if (!data || data.status !== 'completed') {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <main className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-4">
        <StaticBackground imageUrl="/background/analisis.png" />
        <div className="relative z-10 bg-white/80 backdrop-blur-md border border-white/40 rounded-3xl shadow-xl shadow-[#3f94ca]/10 p-8 sm:p-12 flex flex-col items-center max-w-md w-full animate-in zoom-in-95 duration-500">
            <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100/50" />
                    <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent"
                        className="text-[#00be64] transition-all duration-500 ease-out"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold text-slate-800">{progress}%</span>
                </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
                <BrainCircuit className="w-5 h-5 text-[#3f94ca] animate-pulse" />
                <h3 className="text-lg font-bold text-slate-900 text-center">ИИ работает</h3>
            </div>
            <p className="text-slate-500 text-center font-medium h-6 transition-all duration-300">
                {loadingText}
            </p>
        </div>
      </main>
    );
  }

  const result = data.ai_result!;
  const patientInfo = result.patient_info;
  const analysisDate = data.created_at ? format(new Date(data.created_at), 'd MMMM yyyy', { locale: ru }) : 'Неизвестная дата';

  return (
    <main className="relative min-h-screen pt-28 pb-16 px-4 sm:px-8 md:pt-36 md:pb-24 font-sans animate-in fade-in duration-700">
      
      <StaticBackground imageUrl="/background/analisis.png" />

      {/* ОБНОВЛЕННАЯ СЕТКА: flex flex-col lg:flex-row */}
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        
        {/* ЛЕВАЯ КОЛОНКА: Дерево папок (На мобилке опускается вниз через order-2) */}
        <div className="w-full lg:w-[320px] shrink-0 order-2 lg:order-1 lg:sticky lg:top-36">
            <AnalysisTreeSidebar currentId={id} />
        </div>

        {/* ПРАВАЯ КОЛОНКА: Основной контент */}
        <div className="flex-1 w-full space-y-6 order-1 lg:order-2">
            
            {/* --- ШАПКА АНАЛИЗА --- */}
            <div className="bg-transparent backdrop-blur-md rounded-2xl p-6 border border-white/40 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3f94ca]/10 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 pointer-events-none" />
                
                <div className="z-10 flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 md:w-6 md:h-6 text-[#3f94ca]" />
                            Расшифровка от {analysisDate}
                        </h1>
                        {!result.summary.is_critical ? (
                            <span className="px-3 py-1 bg-[#00be64]/10 text-[#00be64] text-xs font-bold rounded-full uppercase tracking-wide">
                                Норма
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wide">
                                Внимание
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
    {result.summary.general_comment}
</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto z-10">
                    <button 
                        onClick={() => router.push('/dashboard')}
                        className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 bg-[#00be64] hover:opacity-90 text-white font-medium rounded-xl transition-opacity w-full sm:w-auto shadow-sm shadow-[#00be64]/30"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Загрузить анализ</span>
                    </button>

                    <button 
                        onClick={handleViewOriginal}
                        disabled={isViewingOriginal}
                        className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 hover:bg-secondary/10 border border-secondary text-slate-700 font-medium rounded-xl transition-colors w-full sm:w-auto"
                    >
                        {isViewingOriginal ? <Loader2 className="w-4 h-4 animate-spin text-[#3f94ca]" /> : <Eye className="w-4 h-4 text-[#3f94ca]" />}
                        <span className="hidden sm:inline">Оригинал</span>
                    </button>

                    <button 
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF}
                        className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 bg-[#3f94ca] hover:opacity-90 disabled:opacity-50 text-white font-medium rounded-xl transition-opacity w-full sm:w-auto shadow-sm shadow-[#3f94ca]/30"
                    >
                        {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        <span className="hidden sm:inline">Скачать PDF</span>
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
                            Показатели
                        </h2>
                        <span className="text-xs text-slate-500 font-medium">{result.indicators.length} значений</span>
                    </div>
                    <div className="divide-y divide-white/40">
                        {result.indicators.map((item, idx) => (
                            <IndicatorRow key={idx} item={item} />
                        ))}
                    </div>
                </div>

                {/* ПРИЧИНЫ И РЕКОМЕНДАЦИИ */}
                <div className="xl:col-span-5 space-y-6">
                    <div className="bg-transparent backdrop-blur-md rounded-xl shadow-sm p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5 text-amber-500" />
                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Причины отклонений</h2>
                        </div>
                        <div className="space-y-3">
                            {result.causes.length > 0 ? result.causes.map((cause, idx) => (
                                <div key={idx} className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/40">
                                    <h3 className="text-sm font-semibold text-slate-900 mb-1">{cause.title}</h3>
                                    <p className="text-xs text-slate-700 leading-relaxed">{cause.description}</p>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500 italic py-2">Явных патологий не выявлено.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-transparent backdrop-blur-md rounded-xl shadow-sm p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="w-5 h-5 text-[#00be64]" />
                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Рекомендации</h2>
                        </div>
                        <ul className="space-y-3">
                            {result.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex gap-3 text-sm text-slate-700">
                                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-[#3f94ca]/10 text-[#3f94ca] rounded-full text-[10px] font-bold mt-0.5">
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
                    <span className="font-bold text-slate-900">Внимание:</span> Данный отчет сгенерирован искусственным интеллектом, не является медицинским диагнозом и носит исключительно информационный характер. Пожалуйста, обязательно проконсультируйтесь с квалифицированным врачом для постановки точного диагноза и назначения лечения.
                </p>
            </div>

        </div>
      </div>
    </main>
  );
}

function IndicatorRow({ item }: { item: AIIndicator }) {
    const isNormal = item.status === 'normal';
    
    return (
      <div className="p-4 sm:p-5 hover:bg-white/50 transition-colors group flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-sm">{item.name}</span>
            {!isNormal && (
              <span className={clsx(
                "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                item.status === 'critical' ? "bg-red-100 text-red-700" :
                item.status === 'high' ? "bg-amber-100 text-amber-700" :
                "bg-[#3f94ca]/10 text-[#3f94ca]"
              )}>
                {item.status === 'critical' ? "Критично" : item.status === 'high' ? "Выше нормы" : "Ниже нормы"}
              </span>
            )}
          </div>
          {item.comment && !isNormal && (
              <p className="text-xs text-amber-700/90 mt-1.5 leading-snug max-w-sm font-medium">
                  {item.comment}
              </p>
          )}
          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
             Референс: {item.ref_range || "—"}
          </p>
        </div>
        
        <div className="text-right whitespace-nowrap">
            <span className={clsx(
              "text-base font-bold block",
              !isNormal ? "text-slate-900" : "text-slate-600"
            )}>
              {item.value}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">{item.unit}</span>
        </div>
      </div>
    );
}