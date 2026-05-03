'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalysisResponse, AIIndicator } from '@/lib/api';
import { ReasoningBlock } from '@/components/analysis/ReasoningBlock';
import { pdf } from '@react-pdf/renderer';
import { AnalysisPDF } from '@/components/analysis/AnalysisPDF';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { 
  Activity, CheckCircle2, FileText, Loader2, User, Download, Eye, Plus, AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';

// Подключаем наш фон
import StaticBackground from '@/components/background/StaticBackground';

// --- ЖЕСТКИЕ ДЕМО-ДАННЫЕ ---
const mockData: AnalysisResponse = {
  uid: "demo-critical-911",
  status: "completed",
  created_at: new Date().toISOString(),
  ai_result: {
    patient_info: {
      extracted_name: "Аноним (Демо-пациент)",
      extracted_birth_date: "Неизвестно",
      extracted_gender: "Не указан"
    },
    summary: {
      is_critical: true, 
      general_comment: "КРИТИЧЕСКОЕ СОСТОЯНИЕ: Обнаружены жизнеугрожающие отклонения по ряду ключевых маркеров. Выраженная гипергликемия, острый воспалительный процесс и признаки серьезного повреждения печени. Настоятельно рекомендуется немедленное обращение за медицинской помощью!"
    },
    reasoning: "На основании предоставленных данных наблюдается картина тяжелого метаболического сбоя. Уровень глюкозы 18.5 ммоль/л указывает на декомпенсированный сахарный диабет с высоким риском кетоацидоза. Показатели печеночных ферментов (АЛТ и АСТ превышают норму более чем в 10 раз) свидетельствуют об остром цитолитическом синдроме — возможно, токсическом или вирусном гепатите. С-реактивный белок (125 мг/л) подтверждает наличие мощного системного воспаления. Пациент нуждается в экстренной госпитализации.",
    causes: [
      {
        title: "Декомпенсированный сахарный диабет",
        description: "Критическое повышение уровня глюкозы. Вероятно отсутствие выработки инсулина или крайняя степень инсулинорезистентности."
      },
      {
        title: "Острое поражение печени",
        description: "Такой скачок АЛТ и АСТ чаще всего бывает при острых вирусных гепатитах, сильном токсическом отравлении (алкоголь, медикаменты, яды) или острой ишемии печени."
      },
      {
        title: "Тяжелая анемия",
        description: "Критически низкий гемоглобин (75 г/л) нарушает кислородный обмен во всем организме, вызывая гипоксию органов."
      }
    ],
    recommendations: [
      {
        type: "medical",
        text: "НЕМЕДЛЕННО ВЫЗВАТЬ СКОРУЮ ПОМОЩЬ или срочно обратиться в приемный покой ближайшей больницы! Существует прямая угроза жизни."
      },
      {
        type: "medical",
        text: "Требуется экстренная консультация эндокринолога для купирования гипергликемии (внутривенная инсулинотерапия) и профилактики комы."
      },
      {
        type: "medical",
        text: "Срочная госпитализация в терапевтическое или реанимационное отделение для выяснения причин разрушения печени (УЗИ, маркеры гепатитов) и переливания крови."
      },
      {
        type: "lifestyle",
        text: "Обеспечить пациенту полный покой. Категорически запрещен прием любых медикаментов без назначения врача (особенно обезболивающих, бьющих по печени) и любой пищи до приезда скорой."
      }
    ],
    indicators: [
      { name: "Глюкоза", value: "18.5", unit: "ммоль/л", ref_range: "4.1 - 5.9", status: "critical", comment: "Риск гипергликемической комы" },
      { name: "АЛТ (Аланинаминотрансфераза)", value: "450", unit: "Ед/л", ref_range: "< 41", status: "critical", comment: "Острое разрушение клеток печени" },
      { name: "АСТ (Аспартатаминотрансфераза)", value: "380", unit: "Ед/л", ref_range: "< 37", status: "critical", comment: "Массированное поражение печени/миокарда" },
      { name: "С-реактивный белок (СРБ)", value: "125", unit: "мг/л", ref_range: "< 5", status: "critical", comment: "Острейший воспалительный процесс" },
      { name: "Гемоглобин", value: "75", unit: "г/л", ref_range: "130 - 160", status: "critical", comment: "Тяжелая степень анемии, гипоксия" },
      { name: "Холестерин ЛПНП", value: "6.2", unit: "ммоль/л", ref_range: "1.7 - 3.5", status: "high", comment: "Высокий риск атеросклероза" },
      { name: "ТТГ", value: "2.1", unit: "мкМЕ/мл", ref_range: "0.4 - 4.0", status: "normal", comment: "" },
    ]
  }
};

export default function ExampleAnalysisPage() {
  const router = useRouter();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const data = mockData;
  const result = data.ai_result;

  if (!result) return null;

  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsGeneratingPDF(true);
    try {
      const blob = await pdf(<AnalysisPDF data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `checkups_critical_demo.pdf`;
      link.style.display = 'none'; 
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error("Ошибка при генерации PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleViewOriginal = () => {
    alert("Это демонстрационный разбор. Просмотр оригинального бланка анализов недоступен.");
  };

  const analysisDate = data.created_at ? format(new Date(data.created_at), 'd MMMM yyyy', { locale: ru }) : 'Неизвестная дата';

  return (
    <main className="relative min-h-screen pt-28 pb-16 px-4 sm:px-8 md:pt-36 md:pb-24 font-sans animate-in fade-in duration-700">
      
      <StaticBackground imageUrl="/background/analisis.png" />

      {/* Обертка контента, аналогичная реальной странице */}
      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        
        {/* --- ШАПКА АНАЛИЗА --- */}
        <div className="bg-transparent backdrop-blur-md rounded-2xl p-6 border border-white/40 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 pointer-events-none" />
            
            <div className="z-10 flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 md:w-6 md:h-6 text-[#3f94ca]" />
                        Пример расшифровки
                    </h1>
                    {/* КРАСНЫЙ БЕЙДЖ КРИТИЧНОСТИ */}
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase tracking-wide flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Критично
                    </span>
                </div>

                <p className="text-sm text-slate-600 max-w-3xl leading-relaxed mt-3">
                    {result.summary.general_comment}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto z-10">
                <button 
                    onClick={() => router.push('/')}
                    className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 bg-[#00be64] hover:opacity-90 text-white font-medium rounded-xl transition-opacity w-full sm:w-auto shadow-sm shadow-[#00be64]/30"
                >
                    <Plus className="w-4 h-4" />
                    <span>Свой анализ</span>
                </button>

                <button 
                    onClick={handleViewOriginal}
                    className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 hover:bg-secondary/10 border border-secondary text-slate-700 font-medium rounded-xl transition-colors w-full sm:w-auto"
                >
                    <Eye className="w-4 h-4 text-[#3f94ca]" />
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
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Причины отклонений</h2>
                    </div>
                    <div className="space-y-3">
                        {result.causes.map((cause, idx) => (
                            <div key={idx} className="bg-red-50/40 p-3 rounded-xl border border-red-100/40">
                                <h3 className="text-sm font-semibold text-slate-900 mb-1">{cause.title}</h3>
                                <p className="text-xs text-slate-700 leading-relaxed">{cause.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-transparent backdrop-blur-md rounded-xl shadow-sm p-4 sm:p-5 border border-red-200 shadow-red-500/10">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-red-600" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Срочные рекомендации</h2>
                    </div>
                    <ul className="space-y-3">
                        {result.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex gap-3 text-sm text-slate-800">
                                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-red-100 text-red-700 rounded-full text-[10px] font-bold mt-0.5">
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
                item.status === 'critical' ? "bg-red-100 text-red-700 animate-pulse" : // Добавлена анимация пульсации для критических
                item.status === 'high' ? "bg-amber-100 text-amber-700" :
                "bg-[#3f94ca]/10 text-[#3f94ca]"
              )}>
                {item.status === 'critical' ? "Критично" : item.status === 'high' ? "Выше нормы" : "Ниже нормы"}
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
             Референс: {item.ref_range || "—"}
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