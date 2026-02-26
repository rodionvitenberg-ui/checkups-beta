"use client";

import { useState, useRef } from 'react';
import { UploadCloud, FileText, Loader2, FileCheck2, AlertCircle, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { uploadAnalysis } from '@/lib/api'; 
import { useRouter } from 'next/navigation';

export function FileUploader() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleUpload(e.target.files[0]);
  };

  const handleUpload = async (file: File) => {
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
      if (!response.uid) throw new Error('ID анализа не получен от сервера');

      setAnalysisId(response.uid);
      setUploadStatus('success');
      
    } catch (err) {
      console.error(err);
      setError('Произошла ошибка при загрузке. Попробуйте еще раз.');
      setUploadStatus('error');
    }
  };

  const handleGetResult = () => {
      if (!analysisId) return;
      
      const token = localStorage.getItem('token');
      if (token) {
          router.push(`/analysis/${analysisId}`);
      } else {
          router.push(`/claim/${analysisId}`);
      }
  };

  // ЭКРАН УСПЕШНОЙ ЗАГРУЗКИ
  if (uploadStatus === 'success') {
      return (
          <div className="w-full max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
              {/* ИЗМЕНЕНИЕ: bg-white -> bg-white/40 backdrop-blur-md, добавили легкую тень */}
              <div className="bg-transparent backdrop-blur-md rounded-3xl border border-white/20 shadow-xl shadow-slate-200/50 p-8 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-green-50/80 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 border border-green-100/50 shadow-inner">
                      <FileCheck2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Загружено успешно</h3>
                  <p className="text-slate-700 font-medium mb-8 max-w-sm">
                      Документ <span className="font-bold text-slate-900">{fileName}</span> сохранен и готов к обработке искусственным интеллектом.
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

  // ЭКРАН ЗАГРУЗКИ / ОЖИДАНИЯ
  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        onClick={() => {
            if (uploadStatus !== 'uploading') {
                if (fileInputRef.current) fileInputRef.current.value = '';
                fileInputRef.current?.click();
            }
        }}
        className={clsx(
          "relative flex flex-col items-center justify-center w-full min-h-[240px] rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer group backdrop-blur-md", // ИЗМЕНЕНИЕ: добавили backdrop-blur-md
          // ИЗМЕНЕНИЕ: bg-slate-50 -> bg-white/30, bg-blue-50 -> bg-blue-50/50
          isDragging ? "border-blue-500 bg-blue-50/50 scale-[1.01]" : "border-slate-300/80 hover:border-blue-400 bg-white/30 hover:bg-white/50 shadow-lg shadow-slate-200/20",
          uploadStatus === 'uploading' && "opacity-80 pointer-events-none border-blue-300 bg-blue-50/40"
        )}
      >
        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png,.heic" />

        {uploadStatus === 'uploading' ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-blue-800 font-bold animate-pulse">Загружаем документ на сервер...</p>
            {fileName && <p className="text-slate-500 font-medium text-sm mt-2">{fileName}</p>}
          </div>
        ) : (
          <div className="text-center p-6">
            <div className={clsx(
              "mx-auto w-16 h-16 mb-4 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm border border-white/50", // ИЗМЕНЕНИЕ: добавили прозрачность и легкую границу иконке
              isDragging ? "bg-blue-100/70 text-blue-600" : "bg-white/60 text-slate-500 group-hover:text-blue-600 group-hover:bg-white/90 shadow-sm"
            )}>
               {isDragging ? <FileText className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {isDragging ? 'Отпустите файл здесь' : 'Загрузить анализы'}
            </h3>
            <p className="text-slate-600 font-medium text-sm max-w-xs mx-auto">
              Нажмите или перетащите PDF, JPG, PNG (до 10MB)
            </p>
          </div>
        )}
      </div>

      {/* ОШИБКА */}
      {uploadStatus === 'error' && error && (
        <div className="mt-4 p-4 flex items-center justify-center gap-2 bg-red-50/80 backdrop-blur-md border border-red-100 text-red-700 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2 shadow-sm">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
    </div>
  );
}