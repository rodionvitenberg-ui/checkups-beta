'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileText } from 'lucide-react';
import { clsx } from 'clsx';
// ВАЖНО: Импортируем локализованный useRouter!
import { useRouter } from '@/i18n/routing';
import { sharedFileStore } from '@/lib/store';
import { useTranslations } from 'next-intl';

export function FileUploader() {
  const router = useRouter();
  const t = useTranslations('FileUploader');
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  
  // Сохраняем файлы в глобальный стор и переходим на страницу управления
  const processFiles = (selectedFiles: File[]) => {
      if (selectedFiles.length > 0) {
          sharedFileStore.files = selectedFiles.slice(0, 3); // Максимум 3 файла
          // Локализованный роутер сам поймет, что нужно пушить на /ru/upload
          router.push('/upload');
      }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); 
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
        processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
        processFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,image/png,image/jpeg" multiple />
      <div 
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={clsx(
          "group relative overflow-hidden cursor-pointer border-2 border-dashed rounded-3xl p-10 transition-all duration-300 ease-in-out bg-white/40 backdrop-blur-md shadow-xl",
          isDragging ? "border-secondary bg-secondary/10 scale-[1.02] shadow-secondary/20" : "border-slate-300 hover:border-secondary/50 hover:bg-white/60 hover:shadow-secondary/10"
        )}
      >
        <div className="text-center">
          <div className={clsx(
            "mx-auto w-20 h-20 mb-6 rounded-2xl flex items-center justify-center transition-colors shadow-sm border border-white/60",
            isDragging ? "bg-secondary/20 text-secondary" : "bg-white/80 text-gray-300 group-hover:text-secondary group-hover:bg-white"
          )}>
             {isDragging ? <FileText className="w-10 h-10" /> : <UploadCloud className="w-10 h-10" />}
          </div>
          <h3 className="text-xl font-bold text-accent mb-2 tracking-tight">
            {isDragging ? t('dropHere') : t('uploadTitle')}
          </h3>
          <p className="text-accent font-medium text-sm max-w-xs mx-auto leading-relaxed">
            {t('formats')} <br/>{t('limit')}
          </p>
        </div>
      </div>
    </div>
  );
}