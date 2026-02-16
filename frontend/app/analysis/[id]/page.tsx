'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAnalysisResult, claimAnalysis, AnalysisResponse, AIIndicator } from '@/lib/api';
import { ReasoningBlock } from '@/components/analysis/ReasoningBlock';
import { 
  Activity, 
  CheckCircle2, 
  FileText, 
  Loader2, 
  Save,
  User,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';

export default function AnalysisPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  
  // State для Claim (Сохранение)
  const [email, setEmail] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // --- Polling ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const fetchStatus = async () => {
      try {
        const result = await getAnalysisResult(id);
        setData(result);
        if (result.status === 'completed' || result.status === 'failed') {
          setIsPolling(false);
          clearInterval(intervalId);
        }
      } catch (error) { console.error(error); }
    };
    fetchStatus();
    if (isPolling) intervalId = setInterval(fetchStatus, 3000);
    return () => clearInterval(intervalId);
  }, [id, isPolling]);

  const handleClaim = async () => {
    if (!email) return;
    setIsClaiming(true);
    try {
        await claimAnalysis(id, email);
        setClaimSuccess(true);
        // В будущем: перенаправление на Dashboard или сохранение токена
    } catch (e) {
        alert('Ошибка при сохранении. Возможно, Email уже занят.');
    } finally {
        setIsClaiming(false);
    }
  };

  // --- Loading Screen ---
  if (!data || data.status !== 'completed') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">
          {data?.status === 'processing' ? 'Интерпретация результатов...' : 'Загрузка данных...'}
        </p>
      </div>
    );
  }

  const result = data.ai_result!;
  const patientInfo = result.patient_info;

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col overflow-hidden font-sans">
      
      {/* 1. Header */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Анализ #{id.slice(0, 6)}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {result.summary.general_comment.slice(0, 100)}...
          </p>
        </div>

        <div className="flex items-center gap-4">
             {/* Если AI нашел пациента - показываем подсказку */}
             {patientInfo?.extracted_name && !claimSuccess && (
                 <div className="hidden md:flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-100">
                    <User className="w-3 h-3 mr-2" />
                    Пациент: {patientInfo.extracted_name} ({patientInfo.extracted_gender === 'Male' ? 'М' : 'Ж'}, {patientInfo.extracted_birth_date})
                 </div>
             )}

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
      </header>

      {/* 2. Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        
        {/* БЛОК 1: Reasoning (Мысли врача) - НОВОЕ */}
        {result.reasoning && (
            <div className="max-w-5xl mx-auto">
                <ReasoningBlock text={result.reasoning} />
            </div>
        )}

        {/* БЛОК 2: Dashboard Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">
            
            {/* Показатели */}
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

            {/* Правая колонка: Причины и Рекомендации */}
            <div className="md:col-span-5 space-y-6">
                
                {/* Причины */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-amber-500" />
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Причины отклонений</h2>
                    </div>
                    <div className="space-y-3">
                        {result.causes.length > 0 ? result.causes.map((cause, idx) => (
                            <div key={idx} className="bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
                                <h3 className="text-sm font-semibold text-slate-900 mb-1">{cause.title}</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">{cause.description}</p>
                            </div>
                        )) : (
                            <p className="text-xs text-slate-400 italic">Явных патологий не выявлено.</p>
                        )}
                    </div>
                </div>

                {/* Рекомендации */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Рекомендации</h2>
                    </div>
                    <ul className="space-y-2">
                        {result.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex gap-3 text-sm text-slate-700">
                                <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 bg-blue-500 rounded-full" />
                                <span className="leading-snug">{rec.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

        </div>
      </div>

      {/* 3. Footer / Auth Trigger */}
      {!claimSuccess ? (
        <div className="flex-shrink-0 bg-blue-900 text-white p-4 shadow-lg z-20">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-800 rounded-full">
                    <AlertCircle className="w-5 h-5 text-blue-200" />
                </div>
                <div className="text-sm opacity-90">
                    <p className="font-semibold">
                        {patientInfo?.extracted_name 
                            ? `Сохранить историю болезни для "${patientInfo.extracted_name}"?`
                            : "Сохраните результат в личном кабинете"}
                    </p>
                    <p className="text-xs text-blue-300">
                        Это позволит отслеживать динамику показателей во времени.
                    </p>
                </div>
            </div>
            
            <div className="flex w-full md:w-auto gap-2">
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ваш Email" 
                    className="flex-1 md:w-64 bg-blue-800 border border-blue-700 text-white text-sm px-4 py-2 rounded-lg placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                    onClick={handleClaim}
                    disabled={isClaiming || !email}
                    className="bg-white text-blue-900 hover:bg-blue-50 px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Сохранить
                </button>
            </div>
            </div>
        </div>
      ) : (
        <div className="flex-shrink-0 bg-green-600 text-white p-3 shadow-lg z-20 text-center">
            <p className="text-sm font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Анализ успешно сохранен! Пароль отправлен на почту.
            </p>
        </div>
      )}

    </div>
  );
}

// Вспомогательный компонент строки
function IndicatorRow({ item }: { item: AIIndicator }) {
    const isNormal = item.status === 'normal';
    
    return (
      <div className="p-4 hover:bg-slate-50 transition-colors group flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900 text-sm">{item.name}</span>
            {/* Если есть slug, можно показать иконку, но пока не будем перегружать */}
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
              <p className="text-xs text-amber-700/80 mt-1 leading-snug max-w-sm">
                  {item.comment}
              </p>
          )}
          <p className="text-[10px] text-slate-400 mt-1">
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
            <span className="text-[10px] text-slate-400">{item.unit}</span>
        </div>
      </div>
    );
  }