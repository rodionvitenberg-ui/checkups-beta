'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Импортируем компонент Image
import { UploadCloud, FileText, Loader2, AlertCircle, ArrowRight, Trash2, FileImage } from 'lucide-react';
import { clsx } from 'clsx';
import { uploadAnalysis } from '@/lib/api';
import StaticBackground from '@/components/background/StaticBackground';
import { sharedFileStore } from '@/lib/store';

export default function UploadPage() {
    const router = useRouter();
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const MAX_FILES = 3;

    // --- МАГИЯ: Забираем файлы, переданные с главной страницы ---
    useEffect(() => {
        if (sharedFileStore.files.length > 0) {
            setFiles(sharedFileStore.files);
            sharedFileStore.files = []; // Очищаем стор, чтобы файлы не висели в памяти
        }
    }, []);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); 
        setIsDragging(false);
        if (e.dataTransfer.files?.length) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            addFiles(Array.from(e.target.files));
        }
    };

    const addFiles = (newFiles: File[]) => {
        setFiles(prev => {
            const combined = [...prev, ...newFiles];
            if (combined.length > MAX_FILES) {
                setError(`Максимум можно загрузить ${MAX_FILES} файла за один раз.`);
                return combined.slice(0, MAX_FILES);
            }
            setError(null);
            return combined;
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (indexToRemove: number) => {
        setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        setError(null);
    };

    const handleStartAnalysis = async () => {
        if (files.length === 0) return;
        setUploadStatus('uploading');
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const isAuth = !!token;

            // Запускаем файлы на бэкенд (авторизованный -> все, аноним -> первый)
            const uploadPromises = files.map((file, index) => uploadAnalysis(file, isAuth ? true : index === 0));
            const results = await Promise.all(uploadPromises);

            const ids = results.map(res => res.uid);
            const idsString = ids.join(',');

            if (isAuth) {
                // Ставим метки NEW, но НЕ ДЕЛАЕМ router.push('/dashboard')
                localStorage.setItem('new_analysis_ids', JSON.stringify(ids));
            }
            
            // ВСЕГДА редиректим на Claim, чтобы показать процесс работы ИИ!
            router.push(`/claim/${idsString}`);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Произошла ошибка при отправке. Попробуйте снова.');
            setUploadStatus('error');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <main className="relative min-h-screen flex flex-col items-center justify-center pt-24 px-4 pb-12">
            <StaticBackground imageUrl="/background/analisis.png" />
            
            <div className="relative z-10 w-full max-w-2xl mx-auto bg-transparent backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl">
                <div className="text-center mb-8">
                    {/* Добавили галочку по центру над заголовком */}
                    <div className="flex justify-center mb-6">
                        <div className="relative w-35 h-35">
                            <Image 
                                src="/done.png" 
                                alt="Готово" 
                                fill 
                                className="object-contain drop-shadow-sm" 
                            />
                        </div>
                    </div>
                    {/* Применили наши стили: font-bold, secondary и accent */}
                    <h1 className="text-3xl font-bold text-card tracking-tight mb-2">Анализы загружены</h1>
                    <p className="text-accent font-medium">Запустите расшифровку или загрузите еще (максимум {MAX_FILES})</p>
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,image/png,image/jpeg" multiple />

                {/* ЗОНА ДОБАВЛЕНИЯ (скрывается, если лимит исчерпан) */}
                {files.length < MAX_FILES && (
                    <div 
                        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={clsx(
                            "group relative overflow-hidden cursor-pointer border-2 border-dashed rounded-2xl p-8 mb-6 transition-all duration-300 ease-in-out bg-white/50 backdrop-blur-md",
                            // Поменяли синий цвет на secondary
                            isDragging ? "border-secondary bg-secondary/10 scale-[1.02] shadow-inner" : "border-slate-300 hover:border-card hover:bg-white/80"
                        )}
                    >
                        <div className="text-center">
                            <div className={clsx(
                                "mx-auto w-16 h-16 mb-4 rounded-xl flex items-center justify-center transition-colors shadow-sm border border-white/60",
                                // Цвета иконки тоже подвязали к secondary и accent
                                isDragging ? "bg-secondary/20 text-card" : "bg-white text-accent group-hover:text-card group-hover:shadow-md"
                            )}>
                                {isDragging ? <FileText className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
                            </div>
                            <h3 className="text-lg font-bold text-accent mb-1">
                                {isDragging ? 'Отпустите файлы' : 'Добавить еще документы'}
                            </h3>
                            <p className="text-accent font-medium text-xs">PDF, JPG, PNG до 10MB</p>
                        </div>
                    </div>
                )}

                {/* СПИСОК ВЫБРАННЫХ ФАЙЛОВ */}
                {files.length > 0 && (
                    <div className="space-y-3 mb-8">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Выбранные файлы</h3>
                            <span className="text-xs font-bold bg-secondary/10 text-secondary px-3 py-1 rounded-full">
                                {files.length} / {MAX_FILES}
                            </span>
                        </div>
                        {files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20 text-secondary">
                                        {file.type === 'application/pdf' ? <FileText className="w-5 h-5" /> : <FileImage className="w-5 h-5" />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-secondary truncate">{file.name}</p>
                                        <p className="text-xs text-accent font-medium mt-0.5">{formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                                <button onClick={() => removeFile(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ОШИБКИ */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                {/* КНОПКА ЗАПУСКА */}
                <button 
                    onClick={handleStartAnalysis}
                    disabled={uploadStatus === 'uploading' || files.length === 0}
                    className={clsx(
                        "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all shadow-lg text-lg",
                        uploadStatus === 'uploading' || files.length === 0
                            ? "bg-slate-300 cursor-not-allowed shadow-none" 
                            : "bg-card hover:shadow-secondary/30 hover:scale-[1.02]"
                    )}
                >
                    {uploadStatus === 'uploading' ? (
                        <><Loader2 className="w-6 h-6 animate-spin" /> Отправка на сервер...</>
                    ) : (
                        <>Запустить анализ <ArrowRight className="w-6 h-6" /></>
                    )}
                </button>
            </div>
        </main>
    );
}