"use client";

import { useState, useRef } from 'react';
import { UploadCloud, FileText, Loader2, FileUp } from 'lucide-react';
import { clsx } from 'clsx';
// Импорт API функции. Убедись, что путь верный.
import { uploadAnalysis } from '@/lib/api'; 
import { useRouter } from 'next/navigation';

export function FileUploader() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    // Валидация
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/heic'].includes(file.type)) {
      setError('Пожалуйста, загрузите PDF или изображение (JPG, PNG)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Размер файла не должен превышать 10MB');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // api.ts: uploadAnalysis возвращает response.data, который соответствует типу AnalysisResponse
      const response = await uploadAnalysis(file);

      // FIX: Используем uid вместо id, согласно интерфейсу в api.ts
      const analysisId = response.uid;

      if (!analysisId) {
        throw new Error('ID анализа не получен от сервера');
      }

      router.push(`/analysis/${analysisId}`);
    } catch (err) {
      console.error(err);
      setError('Произошла ошибка при загрузке. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={clsx(
          "relative flex flex-col items-center justify-center w-full min-h-[240px] rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer group",
          isDragging ? "border-blue-500 bg-blue-50 scale-[1.01]" : "border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white",
          isLoading && "opacity-50 pointer-events-none"
        )}
      >
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileSelect}
          accept=".pdf,.jpg,.jpeg,.png,.heic"
        />

        {isLoading ? (
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Анализируем документ...</p>
          </div>
        ) : (
          <div className="text-center p-6">
            <div className={clsx(
              "mx-auto w-16 h-16 mb-4 rounded-full flex items-center justify-center transition-colors",
              isDragging ? "bg-blue-100 text-blue-600" : "bg-white text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 shadow-sm"
            )}>
               {isDragging ? <FileText className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {isDragging ? 'Отпустите файл здесь' : 'Загрузить анализы'}
            </h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Нажмите или перетащите PDF, JPG, PNG (до 10MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}
    </div>
  );
}