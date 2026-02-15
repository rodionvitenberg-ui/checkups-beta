'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { uploadAnalysis } from '@/lib/api';
import { clsx } from 'clsx';

export default function Home() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обработчики Drag-n-Drop
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  // Главная логика отправки
  const handleUpload = async (file: File) => {
    // Простая валидация
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/heic'].includes(file.type)) {
      setError('Пожалуйста, загрузите PDF или изображение (JPG, PNG).');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Отправляем файл на бэкенд
      const data = await uploadAnalysis(file);
      
      // 2. Если всё ок, редиректим на страницу результата
      // ID анализа придет в ответе (data.uid)
      router.push(`/analysis/${data.uid}`);
      
    } catch (err) {
      console.error(err);
      setError('Ошибка при загрузке файла. Проверьте соединение с сервером.');
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
      
      {/* Заголовок */}
      <div className="text-center max-w-2xl mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-blue-900">
          Checkups AI
        </h1>
        <p className="text-lg text-slate-600">
          Загрузите ваши медицинские анализы, и наш искусственный интеллект 
          проведет их детальную расшифровку, найдет скрытые риски и даст рекомендации.
        </p>
      </div>

      {/* Зона загрузки */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={clsx(
          "w-full max-w-xl h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
          isDragging 
            ? "border-blue-500 bg-blue-50 scale-[1.02]" 
            : "border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50",
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
            <p className="text-slate-500 font-medium">Отправляем данные...</p>
          </div>
        ) : (
          <>
            <div className="p-4 bg-blue-100 rounded-full mb-4">
              {isDragging ? (
                <FileText className="w-8 h-8 text-blue-600" />
              ) : (
                <UploadCloud className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <p className="text-lg font-medium text-slate-700">
              {isDragging ? 'Отпустите файл здесь' : 'Нажмите или перетащите файл'}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              PDF, JPG, PNG (до 10MB)
            </p>
          </>
        )}
      </div>

      {/* Ошибки */}
      {error && (
        <div className="mt-6 flex items-center p-4 text-red-800 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

    </main>
  );
}