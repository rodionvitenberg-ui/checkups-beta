"use client";

import { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { ChartData } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Activity } from 'lucide-react';

interface PatientChartProps {
  history: ChartData[];
}

export function PatientChart({ history }: PatientChartProps) {
  if (!history || history.length === 0) {
    return (
        <div className="text-center flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Activity className="w-10 h-10 mb-3 text-slate-300" />
            <p className="font-medium">Нет данных для построения графиков</p>
        </div>
    );
  }

  const [selectedSlug, setSelectedSlug] = useState<string>(history[0].slug);

  const activeChart = useMemo(() => {
    return history.find(h => h.slug === selectedSlug);
  }, [history, selectedSlug]);

  const chartData = useMemo(() => {
    if (!activeChart) return [];
    return activeChart.data.map(point => ({
      ...point,
      dateObj: parseISO(point.date).getTime(), 
      formattedDate: format(parseISO(point.date), 'd MMM yyyy', { locale: ru })
    }));
  }, [activeChart]);

  // Кастомная всплывающая подсказка
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md border border-slate-100 p-4 rounded-2xl shadow-xl shadow-blue-900/5">
          <p className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-blue-600 tracking-tight">
              {payload[0].value}
            </span>
            <span className="text-sm font-medium text-slate-500">
              {activeChart?.data[0]?.unit || ''}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Шапка графика: Заголовок и Селектор */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            Аналитика показателя
          </h4>
        </div>

        {/* Стилизованный Select */}
        <div className="relative w-full sm:w-auto shrink-0">
          <select 
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="w-full sm:w-[260px] appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block py-2.5 pl-4 pr-10 cursor-pointer transition-all hover:border-blue-300 hover:bg-slate-50 shadow-sm"
          >
            {history.map(item => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          {/* Своя иконка галочки вместо дефолтной браузерной */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Сам График */}
      <div className="h-[280px] sm:h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <defs>
              {/* Красивый градиент под линией */}
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            {/* Убрали вертикальные линии сетки, оставили только горизонтальные пунктиры */}
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
            
            <XAxis 
              dataKey="formattedDate" 
              stroke="#94a3b8" 
              fontSize={12}
              tickLine={false} // Убрали засечки
              axisLine={false} // Убрали жирную линию оси
              tickMargin={12}
              minTickGap={20}
            />
            
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(val) => val.toLocaleString()} // Форматирование длинных чисел
            />
            
            <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} 
            />
            
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#2563eb" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb', className: 'drop-shadow-md' }} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}