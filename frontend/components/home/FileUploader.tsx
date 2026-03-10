'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { sharedFileStore } from '@/lib/store';

export function FileUploader() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  
  // Сохраняем файлы в глобальный стор и переходим на страницу управления
  const processFiles = (selectedFiles: File[]) => {
      if (selectedFiles.length > 0) {
          sharedFileStore.files = selectedFiles.slice(0, 3); // Максимум 3 файла
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
          // Заменили синие цвета бордеров, фонов и теней на secondary
          isDragging ? "border-secondary bg-secondary/10 scale-[1.02] shadow-secondary/20" : "border-slate-300 hover:border-secondary/50 hover:bg-white/60 hover:shadow-secondary/10"
        )}
      >
        <div className="text-center">
          <div className={clsx(
            "mx-auto w-20 h-20 mb-6 rounded-2xl flex items-center justify-center transition-colors shadow-sm border border-white/60",
            // Иконка в спокойном состоянии — accent, при ховере/драге — secondary
            isDragging ? "bg-secondary/20 text-secondary" : "bg-white/80 text-gray-300 group-hover:text-secondary group-hover:bg-white"
          )}>
             {isDragging ? <FileText className="w-10 h-10" /> : <UploadCloud className="w-10 h-10" />}
          </div>
          {/* Заголовок перекрашен в secondary, а font-extrabold изменен на font-bold */}
          <h3 className="text-xl font-bold text-accent mb-2 tracking-tight">
            {isDragging ? 'Бросайте файлы сюда' : 'Загрузить анализы'}
          </h3>
          {/* Описание перекрашено в accent */}
          <p className="text-accent font-medium text-sm max-w-xs mx-auto leading-relaxed">
            Нажмите или перетащите PDF, JPG, PNG <br/>(до 3-х файлов)
          </p>
        </div>
      </div>
    </div>
  );
}