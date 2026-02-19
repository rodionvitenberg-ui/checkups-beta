"use client";

import { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea 
} from 'recharts';
import { ChartData } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface PatientChartProps {
  history: ChartData[];
}

export function PatientChart({ history }: PatientChartProps) {
  // Если данных нет
  if (!history || history.length === 0) {
    return <div className="text-center text-slate-400 py-10">Нет данных для построения графиков</div>;
  }

  // Стейт для выбранного показателя (по умолчанию первый из списка)
  const [selectedSlug, setSelectedSlug] = useState<string>(history[0].slug);

  // Находим данные для выбранного показателя
  const activeChart = useMemo(() => {
    return history.find(h => h.slug === selectedSlug);
  }, [history, selectedSlug]);

  // Форматируем данные для Recharts
  const chartData = useMemo(() => {
    if (!activeChart) return [];
    return activeChart.data.map(point => ({
      ...point,
      // Преобразуем дату в timestamp для правильной сортировки/оси
      dateObj: parseISO(point.date).getTime(), 
      formattedDate: format(parseISO(point.date), 'd MMM yyyy', { locale: ru })
    }));
  }, [activeChart]);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100">
      
      {/* Селектор показателя */}
      <div className="mb-6 flex items-center justify-between">
        <label className="text-sm font-bold text-slate-700">Показатель:</label>
        <select 
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[200px]"
        >
          {history.map(item => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {/* График */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            
            <XAxis 
              dataKey="formattedDate" 
              stroke="#94a3b8" 
              fontSize={12}
              tickMargin={10}
            />
            
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12} 
              domain={['auto', 'auto']} // Авто-масштаб
            />
            
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#2563eb" 
              strokeWidth={3}
              activeDot={{ r: 6 }} 
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {activeChart?.data[0]?.unit && (
        <p className="text-right text-xs text-slate-400 mt-2">
          Единица измерения: {activeChart.data[0].unit}
        </p>
      )}
    </div>
  );
}