'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAnalysisResult, AnalysisResponse, AIIndicator } from '@/lib/api';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Loader2, 
  Save 
} from 'lucide-react';
import { clsx } from 'clsx';

export default function AnalysisPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // --- Polling (Тот же код) ---
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

  // --- DASHBOARD LAYOUT (ONE SCREEN) ---
  return (
    <div className="h-screen w-screen bg-slate-100 p-4 flex flex-col overflow-hidden text-slate-800 font-sans">
      
      {/* 1. Header (Compact) */}
      <header className="flex justify-between items-center mb-3 px-1">
        <div>
          <h1 className="text-lg font-bold text-blue-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Анализ #{id.slice(0, 6)}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {result.summary.general_comment.slice(0, 150)}...
          </p>
        </div>
        {!result.summary.is_critical ? (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">
            Норма
          </span>
        ) : (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wide">
            Есть отклонения
          </span>
        )}
      </header>

      {/* 2. Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        
        {/* LEFT COLUMN: INDICATORS LIST (5 cols) */}
        <div className="col-span-12 md:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              1. Показатели и отклонения
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-slate-50/50 uppercase sticky top-0 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-2 font-medium">Показатель</th>
                  <th className="px-4 py-2 font-medium text-right">Значение</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.indicators.map((item, idx) => (
                  <tr key={idx} className={clsx("hover:bg-slate-50 transition-colors", item.status !== 'normal' && "bg-amber-50/30")}>
                    <td className="px-4 py-2.5 align-top">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      {/* Умный комментарий под названием, если есть отклонение */}
                      {item.status !== 'normal' && (
                        <div className="text-xs text-amber-700 mt-0.5 leading-snug">
                           {item.comment} 
                           {/* Пример: "показатель снижен (микроцитоз)" */}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Норма: {item.ref_range}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right align-top whitespace-nowrap">
                      <span className={clsx(
                        "font-bold block",
                        item.status === 'critical' ? "text-red-600" :
                        item.status === 'high' || item.status === 'low' ? "text-amber-600" :
                        "text-slate-700"
                      )}>
                        {item.value}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: INSIGHTS (7 cols) */}
        <div className="col-span-12 md:col-span-7 flex flex-col gap-4 min-h-0">
          
          {/* TOP RIGHT: CAUSES */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
             <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  2. Возможные причины
                </h2>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {result.causes.length > 0 ? result.causes.map((cause, idx) => (
                  <div key={idx}>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      {cause.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {cause.description}
                    </p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400 italic">Отклонений не найдено.</p>
                )}
             </div>
          </div>

          {/* BOTTOM RIGHT: RECOMMENDATIONS */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
             <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  3. Рекомендации
                </h2>
             </div>
             <div className="flex-1 overflow-y-auto p-4">
               <ul className="space-y-3">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-700 leading-snug">
                      <span className="flex-shrink-0 w-1.5 h-1.5 mt-1.5 bg-blue-500 rounded-full" />
                      {rec.text}
                    </li>
                  ))}
               </ul>
             </div>
          </div>
        </div>
      </div>

      {/* 3. Footer / Auth Trigger */}
      <div className="mt-3 bg-blue-900 rounded-xl p-3 text-white flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
           <AlertCircle className="w-5 h-5 text-blue-300 opacity-80" />
           <div className="text-xs opacity-80 max-w-xl leading-tight">
             Важное замечание: Данный анализ носит информационный характер. 
             Необходима очная консультация специалиста.
           </div>
        </div>
        
        {/* Форма "Lazy Auth" встроена компактно */}
        <div className="flex items-center gap-2">
           <input 
             type="email" 
             placeholder="Email для сохранения" 
             className="bg-blue-800 border border-blue-700 text-white text-sm px-3 py-1.5 rounded placeholder-blue-400 focus:outline-none focus:border-blue-300 w-48"
           />
           <button className="bg-white text-blue-900 hover:bg-blue-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-colors">
             <Save className="w-4 h-4" />
             Сохранить
           </button>
        </div>
      </div>

    </div>
  );
}