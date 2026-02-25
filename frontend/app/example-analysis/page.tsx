'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalysisResponse } from '@/lib/api';
import { ReasoningBlock } from '@/components/analysis/ReasoningBlock';
import { pdf } from '@react-pdf/renderer';
import { AnalysisPDF } from '@/components/analysis/AnalysisPDF';

import { 
  Activity, 
  CheckCircle2, 
  FileText, 
  Loader2, 
  User,
  AlertCircle,
  Download,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { clsx } from 'clsx';

// --- СОЗДАЕМ РЕАЛИСТИЧНЫЕ ДЕМО-ДАННЫЕ ---
const mockData: AnalysisResponse = {
  uid: "demo-example-1234",
  status: "completed",
  created_at: new Date().toISOString(),
  ai_result: {
    patient_info: {
      extracted_name: "Иванов Иван (Демо-пациент)",
      extracted_birth_date: "15.05.1985",
      extracted_gender: "Мужской"
    },
    summary: {
      is_critical: true, // Сделаем true, чтобы показать красивый красный баннер
      general_comment: "Обнаружены существенные отклонения в липидном профиле и уровне печеночных ферментов. Рекомендуется обратить внимание на показатели холестерина и ферритина."
    },
    reasoning: "На основании предоставленных данных наблюдается классическая картина нарушения липидного обмена на фоне возможного дефицита железа. Повышение АЛТ может указывать на начальные изменения в печени, вероятно, связанные с питанием (жировой гепатоз). Сниженный витамин D усугубляет общую утомляемость.",
    causes: [
      {
        title: "Нарушение липидного профиля",
        description: "Повышенный уровень общего холестерина и ЛПНП часто связан с избытком насыщенных жиров в рационе и недостатком физической активности."
      },
      {
        title: "Снижение ферритина",
        description: "Может быть следствием недостаточного поступления железа с пищей или нарушения его усвоения в ЖКТ."
      }
    ],
    recommendations: [
      {
        type: "lifestyle",
        text: "Средиземноморская диета: увеличить долю свежих овощей, рыбы и оливкового масла. Исключить трансжиры."
      },
      {
        type: "medical",
        text: "Рекомендуется очная консультация терапевта или гастроэнтеролога для проведения УЗИ брюшной полости."
      },
      {
        type: "supplements",
        text: "Обсудить с врачом прием профилактических доз Витамина D3 (не менее 2000 МЕ в сутки)."
      }
    ],
    indicators: [
      { name: "Холестерин общий", value: "6.8", unit: "ммоль/л", ref_range: "3.2 - 5.2", status: "high", comment: "Значительное повышение, высокий риск атеросклероза" },
      { name: "Холестерин ЛПНП", value: "4.5", unit: "ммоль/л", ref_range: "1.7 - 3.5", status: "high", comment: "Плохой холестерин выше нормы" },
      { name: "АЛТ", value: "55", unit: "Ед/л", ref_range: "< 41", status: "high", comment: "Умеренное повышение печеночного фермента" },
      { name: "Ферритин", value: "15", unit: "мкг/л", ref_range: "30 - 400", status: "low", comment: "Скрытый железодефицит" },
      { name: "Витамин D", value: "18", unit: "нг/мл", ref_range: "30 - 100", status: "low", comment: "Выраженный дефицит" },
      { name: "Гемоглобин", value: "145", unit: "г/л", ref_range: "130 - 160", status: "normal" },
      { name: "Глюкоза", value: "5.1", unit: "ммоль/л", ref_range: "4.1 - 5.9", status: "normal" },
      { name: "ТТГ", value: "2.1", unit: "мкМЕ/мл", ref_range: "0.4 - 4.0", status: "normal" },
    ]
  }
};

export default function ExampleAnalysisPage() {
  const router = useRouter();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Берем данные напрямую из мока
  const data = mockData;
  const result = data.ai_result;

  if (!result) return null;

  const abnormalIndicators = result.indicators.filter(i => i.status !== 'normal');
  const normalIndicators = result.indicators.filter(i => i.status === 'normal');

  // Скачивание PDF (работает реально!)
  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsGeneratingPDF(true);
    try {
      const blob = await pdf(<AnalysisPDF data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `checkups_demo_analysis.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка при генерации PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Заглушка для просмотра оригинала
  const handleViewOriginal = () => {
    alert("Это демонстрационный разбор. Просмотр оригинального бланка анализов недоступен.");
  };

  return (
    // ИЗМЕНЕНО: Добавлены классы pt-28 pb-16 px-4 sm:px-8 md:pt-36 md:pb-24
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 pt-28 pb-16 px-4 sm:px-8 md:pt-36 md:pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Кнопка "Назад" */}
        <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium mb-4"
        >
            <ArrowLeft className="w-4 h-4" />
            На главную
        </button>

        {/* --- ШАПКА АНАЛИЗА --- */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-3">
                  <Activity className="w-3 h-3" />
                  Пример разбора
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Результат расшифровки</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                    <User className="w-4 h-4 text-slate-400" />
                    {result.patient_info?.extracted_name || 'Демо-пациент'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto z-10">
                <button
                    onClick={handleViewOriginal}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors w-full sm:w-auto"
                >
                    <Eye className="w-4 h-4" />
                    <span>Оригинал</span>
                </button>

                <button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors w-full sm:w-auto shadow-sm shadow-blue-200"
                >
                    {isGeneratingPDF ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
                    <span>Скачать PDF</span>
                </button>
            </div>
        </div>

        {/* --- SUMMARY (ГЛАВНЫЙ ВЫВОД) --- */}
        {result.summary && (
          <div className={clsx(
            "rounded-2xl p-6 border shadow-sm",
            result.summary.is_critical 
              ? "bg-red-50 border-red-100 text-red-900" 
              : "bg-green-50 border-green-100 text-green-900"
          )}>
            <div className="flex items-start gap-4">
              <div className={clsx(
                "p-3 rounded-xl shrink-0",
                result.summary.is_critical ? "bg-red-100" : "bg-green-100"
              )}>
                {result.summary.is_critical ? (
                   <AlertCircle className="w-6 h-6 text-red-600" />
                ) : (
                   <CheckCircle2 className="w-6 h-6 text-green-600" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">
                  {result.summary.is_critical ? "Требует внимания" : "Всё в норме"}
                </h3>
                <p className="opacity-90 leading-relaxed">
                  {result.summary.general_comment}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- ЛОГИКА ИИ (REASONING) --- */}
        {result.reasoning && (
           <ReasoningBlock text={result.reasoning} />
        )}

        {/* --- СПИСОК ПОКАЗАТЕЛЕЙ --- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
             <FileText className="w-5 h-5 text-slate-500" />
             <h2 className="font-bold text-lg text-slate-900">Распознанные показатели</h2>
          </div>
          
          <div className="divide-y divide-slate-100">
            {abnormalIndicators.length > 0 && (
              <div className="p-4 bg-amber-50/30 border-b border-slate-100">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Отклонения ({abnormalIndicators.length})
                </span>
              </div>
            )}
            
            {abnormalIndicators.map((item, idx) => (
               <IndicatorRow key={`abnormal-${idx}`} item={item} isNormal={false} />
            ))}

            {normalIndicators.length > 0 && (
              <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  В пределах нормы ({normalIndicators.length})
                </span>
              </div>
            )}
            
            {normalIndicators.map((item, idx) => (
               <IndicatorRow key={`normal-${idx}`} item={item} isNormal={true} />
            ))}
          </div>
        </div>

        {/* --- ПРИЧИНЫ И РЕКОМЕНДАЦИИ --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Причины */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Возможные причины
            </h2>
            <ul className="space-y-4">
              {result.causes?.map((cause, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{cause.title}</h4>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{cause.description}</p>
                  </div>
                </li>
              ))}
              {(!result.causes || result.causes.length === 0) && (
                <li className="text-sm text-slate-500">Причины отклонений не выявлены.</li>
              )}
            </ul>
          </div>

          {/* Рекомендации */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Рекомендации
            </h2>
            <ul className="space-y-4">
              {result.recommendations?.map((rec, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded mb-1">
                      {rec.type === 'lifestyle' ? 'Образ жизни' : rec.type === 'medical' ? 'Врач' : 'Добавки'}
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed">{rec.text}</p>
                  </div>
                </li>
              ))}
              {(!result.recommendations || result.recommendations.length === 0) && (
                <li className="text-sm text-slate-500">Нет специфических рекомендаций.</li>
              )}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

// Вспомогательный компонент для отрисовки строки показателя
function IndicatorRow({ item, isNormal }: { item: any, isNormal: boolean }) {
    return (
      <div className="p-4 hover:bg-slate-50 transition-colors group flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
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
              item.status === 'critical' ? "text-red-600" :
              item.status === 'high' ? "text-amber-600" :
              item.status === 'low' ? "text-blue-600" :
              "text-slate-900"
            )}>
              {item.value} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
            </span>
        </div>
      </div>
    );
}