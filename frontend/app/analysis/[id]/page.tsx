'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAnalysisResult, viewOriginalFile, AnalysisResponse, AIIndicator } from '@/lib/api';
import { ReasoningBlock } from '@/components/analysis/ReasoningBlock';
import { pdf } from '@react-pdf/renderer';
import { AnalysisPDF } from '@/components/analysis/AnalysisPDF';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FileUploader } from '@/components/home/FileUploader';

import { 
  Activity, CheckCircle2, FileText, Loader2, Download, Eye, BrainCircuit, Plus, X, AlertTriangle, Info, CheckCircle
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
  
  // Состояние для модального окна загрузки
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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
        "Оценка динамики по истории...",
        "Анализ полученных данных ИИ...",
        "Поиск возможных причин...",
        "Формируются выводы и рекомендации..."
    ];

    let currentProgress = 0;
    const progressInterval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 3) + 2; 
        if (currentProgress > 95) currentProgress = 98; 
        setProgress(currentProgress);

        if (currentProgress < 15) setLoadingText(texts[0]);
        else if (currentProgress < 30) setLoadingText(texts[1]);
        else if (currentProgress < 45) setLoadingText(texts[2]);
        else if (currentProgress < 65) setLoadingText(texts[3]);
        else if (currentProgress < 85) setLoadingText(texts[4]);
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
  const analysisDate = (() => {
      const extDate = data.ai_result?.patient_info?.extracted_date;
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
      return format(d, 'd MMMM yyyy', { locale: ru });
  })();

  // --- МАГИЯ ГРУППИРОВКИ ПОКАЗАТЕЛЕЙ ПО КАТЕГОРИЯМ ---
  const groupedIndicators = result.indicators.reduce((acc, current) => {
      const category = current.category || 'Общие показатели';
      if (!acc[category]) acc[category] = [];
      acc[category].push(current);
      return acc;
  }, {} as Record<string, AIIndicator[]>);

  return (
    <main className="relative min-h-screen pt-28 pb-16 px-4 sm:px-8 md:pt-36 md:pb-24 font-sans animate-in fade-in duration-700">
      
      <StaticBackground imageUrl="/background/analisis.png" />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="w-full lg:w-[320px] shrink-0 order-2 lg:order-1 lg:sticky lg:top-36">
            <AnalysisTreeSidebar currentId={id} />
        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div className="flex-1 w-full space-y-6 order-1 lg:order-2">
            
            {/* --- ШАПКА АНАЛИЗА --- */}
            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
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
                    <p className="text-sm text-slate-600 max-w-3xl leading-relaxed font-medium">
                        {result.summary.general_comment}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto z-10">
                    <button 
                        onClick={() => setIsUploadModalOpen(true)} 
                        className="group flex items-center justify-center gap-2 bg-gradient-to-r from-[#3f94ca] to-[#00be64] text-white px-6 py-3 rounded-2xl hover:opacity-90 transition-all shadow-lg hover:-translate-y-0.5 font-semibold w-full sm:w-auto"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        <span>Добавить анализ</span>
                    </button>
                    
                    <button 
                        onClick={handleViewOriginal}
                        disabled={isViewingOriginal}
                        className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl transition-colors w-full sm:w-auto shadow-sm"
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

            {/* --- КОНТЕНТ (ЛОГИКА ИИ И ДИНАМИКА) --- */}
            {result.reasoning && (
                <ReasoningBlock text={result.reasoning} />
            )}

            {/* --- СЕТКА ДАННЫХ --- */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* ТАБЛИЦА ПОКАЗАТЕЛЕЙ (Сгруппированная) */}
                <div className="xl:col-span-7 rounded-xl shadow-xl shadow-slate-200/30 overflow-hidden bg-white/40 backdrop-blur-md border border-white/60">
                    <div className="px-5 py-4 bg-white/60 border-b border-white/40 flex justify-between items-center backdrop-blur-sm">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            Показатели по системам
                        </h2>
                        <span className="text-xs text-slate-500 font-semibold bg-white px-2 py-1 rounded-md shadow-sm">
                            {result.indicators.length} значений
                        </span>
                    </div>
                    
                    <div className="flex flex-col">
                        {Object.entries(groupedIndicators).map(([category, items]) => (
                            <div key={category} className="border-b border-slate-200/50 last:border-b-0">
                                {/* Заголовок категории */}
                                <div className="bg-slate-50/60 px-5 py-2.5 backdrop-blur-sm flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-[#3f94ca] rounded-full"></div>
                                    <h3 className="text-sm font-bold text-slate-700">{category}</h3>
                                </div>
                                {/* Элементы категории */}
                                <div className="divide-y divide-slate-100/50">
                                    {items.map((item, idx) => (
                                        <IndicatorRow key={idx} item={item} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ПРИЧИНЫ И РЕКОМЕНДАЦИИ */}
                <div className="xl:col-span-5 space-y-6">
                    {/* Светофор причин */}
                    <div className="bg-white/40 backdrop-blur-md rounded-xl shadow-xl shadow-slate-200/30 border border-white/60 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5 text-slate-700" />
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Возможные причины</h2>
                        </div>
                        <div className="space-y-3">
                            {result.causes.length > 0 ? result.causes.map((cause, idx) => {
                                // Определяем стили "Светофора"
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
                                <p className="text-sm text-slate-500 italic py-2">Явных отклонений не выявлено.</p>
                            )}
                        </div>
                    </div>

                    {/* Рекомендации */}
                    <div className="bg-white/40 backdrop-blur-md rounded-xl shadow-xl shadow-slate-200/30 border border-white/60 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="w-5 h-5 text-[#00be64]" />
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Рекомендации</h2>
                        </div>
                        <ul className="space-y-3">
                            {result.recommendations.map((rec, idx) => (
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
            </div>

            {/* --- ДИСКЛЕЙМЕР ВНИЗУ --- */}
            <div className="bg-white/40 backdrop-blur-md rounded-xl shadow-sm border border-white/50 p-6 text-center mt-8">
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    <span className="font-bold text-slate-900">Внимание:</span> Данный отчет сгенерирован искусственным интеллектом, не является медицинским диагнозом и носит исключительно информационный характер. Пожалуйста, обязательно проконсультируйтесь с квалифицированным врачом для постановки точного диагноза и назначения лечения.
                </p>
            </div>

        </div>

        {/* --- МОДАЛЬНОЕ ОКНО ЗАГРУЗКИ --- */}
        {isUploadModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative border border-white/20">
                    <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-xl font-bold text-slate-900">Загрузка анализа</h3>
                        <button 
                            onClick={() => setIsUploadModalOpen(false)} 
                            className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1.5 shadow-sm border border-slate-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6">
                        <FileUploader /> 
                    </div>
                </div>
            </div>
        )}
      </div>
    </main>
  );
}

function IndicatorRow({ item }: { item: AIIndicator }) {
    const isNormal = item.status === 'normal';
    
    return (
      <div className="p-4 sm:p-5 hover:bg-white/60 transition-colors group flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 text-sm">{item.name}</span>
            {!isNormal && (
              <span className={clsx(
                "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm",
                item.status === 'critical' ? "bg-red-100 text-red-700 border border-red-200" :
                item.status === 'high' ? "bg-amber-100 text-amber-700 border border-amber-200" :
                "bg-[#3f94ca]/10 text-[#3f94ca] border border-[#3f94ca]/20"
              )}>
                {item.status === 'critical' ? "Критично" : item.status === 'high' ? "Выше нормы" : "Ниже нормы"}
              </span>
            )}
          </div>
          {item.comment && !isNormal && (
              <p className="text-xs text-slate-700 mt-1.5 leading-snug max-w-sm font-medium border-l-2 border-amber-300 pl-2">
                  {item.comment}
              </p>
          )}
          <p className="text-[10px] text-slate-500 mt-1.5 font-semibold">
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
            <span className="text-[10px] text-slate-500 font-bold">{item.unit}</span>
        </div>
      </div>
    );
}