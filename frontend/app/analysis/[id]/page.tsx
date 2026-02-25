'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAnalysisResult, viewOriginalFile, AnalysisResponse, AIIndicator } from '@/lib/api';
import { ReasoningBlock } from '@/components/analysis/ReasoningBlock';
import { pdf } from '@react-pdf/renderer';
import { AnalysisPDF } from '@/components/analysis/AnalysisPDF';

import { 
  Activity, CheckCircle2, FileText, Loader2, User, Download, Eye, BrainCircuit
} from 'lucide-react';
import { clsx } from 'clsx';

export default function AnalysisPage() {
  const params = useParams();
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
          setProgress(100); // Принудительно 100% при завершении
          clearInterval(intervalId);
        }
      } catch (error) { console.error(error); }
    };
    fetchStatus();
    if (isPolling) intervalId = setInterval(fetchStatus, 3000);
    return () => clearInterval(intervalId);
  }, [id, isPolling]);

  // useEffect для "фейковой" анимации процентов и смены текста
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
        // Добавляем от 2 до 5 процентов случайным образом
        currentProgress += Math.floor(Math.random() * 4) + 2; 
        
        // Тормозим на 95%, ждем ответа от бэкенда
        if (currentProgress > 95) currentProgress = 95; 
        
        setProgress(currentProgress);

        // Динамически меняем текст в зависимости от прогресса
        if (currentProgress < 15) setLoadingText(texts[0]);
        else if (currentProgress < 35) setLoadingText(texts[1]);
        else if (currentProgress < 55) setLoadingText(texts[2]);
        else if (currentProgress < 75) setLoadingText(texts[3]);
        else if (currentProgress < 90) setLoadingText(texts[4]);
        else setLoadingText(texts[5]);

    }, 800); // Обновляем каждые 800мс

    return () => clearInterval(progressInterval);
  }, [isPolling]);

  // Функции работы с файлами
  const handleDownloadPDF = async () => {
    if (!data) return;
    setIsGeneratingPDF(true);
    try {
      const blob = await pdf(<AnalysisPDF data={data!} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Checkups_Report_${id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка при генерации PDF:", error);
      alert("Не удалось сгенерировать PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleViewOriginal = async () => {
    setIsViewingOriginal(true);
    try {
      await viewOriginalFile(id);
    } catch (error) {
      console.error("Ошибка открытия оригинала:", error);
      alert("Не удалось загрузить исходный файл.");
    } finally {
      setIsViewingOriginal(false);
    }
  };

  // --- ИНТЕРАКТИВНЫЙ ЛОАДЕР ---
  if (!data || data.status !== 'completed') {
    // Вычисляем длину окружности для SVG прогресс-бара
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 pt-20 px-4">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 sm:p-12 flex flex-col items-center max-w-md w-full animate-in zoom-in-95 duration-500">
            
            {/* Круговой прогресс-бар */}
            <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
                {/* Фоновый серый круг */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle 
                        cx="80" cy="80" r={radius} 
                        stroke="currentColor" strokeWidth="12" fill="transparent" 
                        className="text-slate-100" 
                    />
                    {/* Зеленый заполняющийся круг */}
                    <circle 
                        cx="80" cy="80" r={radius} 
                        stroke="currentColor" strokeWidth="12" fill="transparent"
                        className="text-green-500 transition-all duration-500 ease-out"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </svg>
                {/* Проценты внутри */}
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold text-slate-800">{progress}%</span>
                </div>
            </div>

            {/* Текст и иконка */}
            <div className="flex items-center gap-3 mb-2">
                <BrainCircuit className="w-5 h-5 text-blue-500 animate-pulse" />
                <h3 className="text-lg font-bold text-slate-900 text-center">ИИ работает</h3>
            </div>
            <p className="text-slate-500 text-center font-medium h-6 transition-all duration-300">
                {loadingText}
            </p>
        </div>
      </div>
    );
  }

  // --- РЕЗУЛЬТАТ АНАЛИЗА ---
  const result = data.ai_result!;
  const patientInfo = result.patient_info;

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-4 sm:px-8 md:pt-36 md:pb-24 font-sans animate-in fade-in duration-700">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* --- ШАПКА АНАЛИЗА --- */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 pointer-events-none" />
            
            <div className="z-10 flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                        Анализ #{id.slice(0, 6)}
                    </h1>
                    {!result.summary.is_critical ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">
                            Норма
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wide">
                            Внимание
                        </span>
                    )}
                </div>
                <p className="text-sm text-slate-500 max-w-xl">
                    {result.summary.general_comment.slice(0, 120)}...
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto z-10">
                {patientInfo?.extracted_name && (
                    <div className="hidden lg:flex items-center px-3 py-2.5 bg-slate-50 text-slate-700 text-sm font-medium rounded-xl border border-slate-200">
                        <User className="w-4 h-4 mr-2 text-slate-400" />
                        {patientInfo.extracted_name}
                    </div>
                )}
                <button 
                    onClick={handleViewOriginal}
                    disabled={isViewingOriginal}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors w-full sm:w-auto"
                >
                    {isViewingOriginal ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                    <span>Оригинал</span>
                </button>

                <button 
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors w-full sm:w-auto shadow-sm shadow-blue-200"
                >
                    {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>Скачать PDF</span>
                </button>
            </div>
        </div>

        {/* --- КОНТЕНТ (ЛОГИКА ИИ) --- */}
        {result.reasoning && (
            <ReasoningBlock text={result.reasoning} />
        )}

        {/* --- СЕТКА ДАННЫХ --- */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">
            
            {/* ТАБЛИЦА ПОКАЗАТЕЛЕЙ */}
            <div className="md:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                        Показатели
                    </h2>
                    <span className="text-xs text-slate-400">{result.indicators.length} значений</span>
                </div>
                <div className="divide-y divide-slate-100">
                    {result.indicators.map((item, idx) => (
                        <IndicatorRow key={idx} item={item} />
                    ))}
                </div>
            </div>

            {/* ПРИЧИНЫ И РЕКОМЕНДАЦИИ */}
            <div className="md:col-span-5 space-y-6">
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-amber-500" />
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Причины отклонений</h2>
                    </div>
                    <div className="space-y-3">
                        {result.causes.length > 0 ? result.causes.map((cause, idx) => (
                            <div key={idx} className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                                <h3 className="text-sm font-semibold text-slate-900 mb-1">{cause.title}</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">{cause.description}</p>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-400 italic py-2">Явных патологий не выявлено.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Рекомендации</h2>
                    </div>
                    <ul className="space-y-3">
                        {result.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex gap-3 text-sm text-slate-700">
                                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold mt-0.5">
                                    {idx + 1}
                                </span>
                                <span className="leading-relaxed">{rec.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

function IndicatorRow({ item }: { item: AIIndicator }) {
    const isNormal = item.status === 'normal';
    
    return (
      <div className="p-4 sm:p-5 hover:bg-slate-50 transition-colors group flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-900 text-sm">{item.name}</span>
            {!isNormal && (
              <span className={clsx(
                "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                item.status === 'critical' ? "bg-red-100 text-red-700" :
                item.status === 'high' ? "bg-amber-100 text-amber-700" :
                "bg-blue-100 text-blue-700"
              )}>
                {item.status === 'critical' ? "Критично" : item.status === 'high' ? "Выше нормы" : "Ниже нормы"}
              </span>
            )}
          </div>
          {item.comment && !isNormal && (
              <p className="text-xs text-amber-700/80 mt-1.5 leading-snug max-w-sm">
                  {item.comment}
              </p>
          )}
          <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
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
            <span className="text-[10px] text-slate-400 font-medium">{item.unit}</span>
        </div>
      </div>
    );
}