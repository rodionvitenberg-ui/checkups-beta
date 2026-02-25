"use client";

import { useState, useRef } from 'react';
import { UploadCloud, FileText, Loader2, FileCheck2, AlertCircle, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { uploadAnalysis } from '@/lib/api'; 
import { useRouter } from 'next/navigation';

export function FileUploader() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  
  // Новые состояния загрузки
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  // Храним ID созданного анализа и имя файла
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
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
      setUploadStatus('error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Размер файла не должен превышать 10MB');
      setUploadStatus('error');
      return;
    }

    setUploadStatus('uploading');
    setError(null);
    setFileName(file.name);

    try {
      const response = await uploadAnalysis(file);
      
      if (!response.uid) {
        throw new Error('ID анализа не получен от сервера');
      }

      // Сохраняем ID и показываем промежуточный экран успеха
      setAnalysisId(response.uid);
      setUploadStatus('success');
      
    } catch (err) {
      console.error(err);
      setError('Произошла ошибка при загрузке. Попробуйте еще раз.');
      setUploadStatus('error');
    }
  };

  // Логика перехода по кнопке "Получить результат"
  const handleGetResult = () => {
      if (!analysisId) return;
      
      const token = localStorage.getItem('token');
      if (token) {
          // Если авторизован - на страницу анализа
          router.push(`/analysis/${analysisId}`);
      } else {
          // Если аноним - на страницу псевдо-регистрации
          router.push(`/claim/${analysisId}`);
      }
  };

  // Если файл успешно загружен, показываем промежуточный экран
  if (uploadStatus === 'success') {
      return (
          <div className="w-full max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                      <FileCheck2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Загружено успешно</h3>
                  <p className="text-slate-500 mb-8 max-w-sm">
                      Документ <span className="font-semibold text-slate-700">{fileName}</span> сохранен и готов к обработке искусственным интеллектом.
                  </p>
                  
                  <button 
                      onClick={handleGetResult}
                      className="group flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-green-200 hover:-translate-y-1 w-full sm:w-auto justify-center"
                  >
                      Получить результат
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
              </div>
          </div>
      );
  }

  // Стандартный экран загрузки
  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => uploadStatus !== 'uploading' && fileInputRef.current?.click()}
        className={clsx(
          "relative flex flex-col items-center justify-center w-full min-h-[240px] rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer group",
          isDragging ? "border-blue-500 bg-blue-50 scale-[1.01]" : "border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white",
          uploadStatus === 'uploading' && "opacity-80 pointer-events-none border-blue-200 bg-blue-50/50"
        )}
      >
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileSelect}
          accept=".pdf,.jpg,.jpeg,.png,.heic"
        />

        {uploadStatus === 'uploading' ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-blue-600 font-semibold animate-pulse">Загружаем документ на сервер...</p>
            {fileName && <p className="text-slate-400 text-sm mt-2">{fileName}</p>}
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

      {uploadStatus === 'error' && error && (
        <div className="mt-4 p-4 flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
    </div>
  );
}