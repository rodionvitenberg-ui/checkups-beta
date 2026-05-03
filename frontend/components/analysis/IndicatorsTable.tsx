'use client';

import { clsx } from 'clsx';
import { AIIndicator } from '@/lib/types';
import { useTranslations } from 'next-intl';

export function IndicatorsTable({ indicators }: { indicators: AIIndicator[] }) {
    const t = useTranslations('Analysis.Indicators');

    // МАГИЯ ГРУППИРОВКИ ПОКАЗАТЕЛЕЙ ПО КАТЕГОРИЯМ
    const groupedIndicators = indicators.reduce((acc, current) => {
        const category = current.category || t('defaultCategory');
        if (!acc[category]) acc[category] = [];
        acc[category].push(current);
        return acc;
    }, {} as Record<string, AIIndicator[]>);

    return (
        <div className="xl:col-span-7 rounded-xl shadow-xl shadow-slate-200/30 overflow-hidden bg-white/40 backdrop-blur-md border border-white/60">
            <div className="px-5 py-4 bg-white/60 border-b border-white/40 flex justify-between items-center backdrop-blur-sm">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    {t('title')}
                </h2>
                <span className="text-xs text-slate-500 font-semibold bg-white px-2 py-1 rounded-md shadow-sm">
                    {t('count', { count: indicators.length })}
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
    );
}

function IndicatorRow({ item }: { item: AIIndicator }) {
    const t = useTranslations('Analysis.Indicators');
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
                {item.status === 'critical' ? t('statusCritical') : item.status === 'high' ? t('statusHigh') : t('statusLow')}
              </span>
            )}
          </div>
          {item.comment && !isNormal && (
              <p className="text-xs text-slate-700 mt-1.5 leading-snug max-w-sm font-medium border-l-2 border-amber-300 pl-2">
                  {item.comment}
              </p>
          )}
          <p className="text-[10px] text-slate-500 mt-1.5 font-semibold">
             {t('reference')}: {item.ref_range || "—"}
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