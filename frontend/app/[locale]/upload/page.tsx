'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import Image from 'next/image';
import { UploadCloud, FileText, Loader2, AlertCircle, Trash2, FileImage, User, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import { uploadAnalysis, getProfiles } from '@/lib/api';
import { PatientProfile } from '@/lib/types';
import StaticBackground from '@/components/background/StaticBackground';
import { useTranslations } from 'next-intl';
import { useStore } from '@/lib/store';

export default function UploadPage() {
    const router = useRouter();
    const t = useTranslations('Upload');
    const setPaywallOpen = useStore((state) => state.setPaywallOpen);
    
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isAgreed, setIsAgreed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isAuth, setIsAuth] = useState(false);
    const [profiles, setProfiles] = useState<PatientProfile[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<number | 'new' | null>(null);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

    // Динамический лимит: 3 для авторизованных (PRO), 1 для гостей
    const MAX_FILES = isAuth ? 3 : 1;

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuth(true);
            loadProfiles();
        } else {
            setIsAuth(false);
            setIsLoadingProfiles(false);
        }
    }, []);

    const loadProfiles = async () => {
        try {
            const data = await getProfiles();
            setProfiles(data);
            if (data.length > 0) {
                setSelectedProfileId(data[0].id);
            } else {
                setSelectedProfileId('new');
            }
        } catch (err) {
            console.error("Ошибка загрузки профилей", err);
        } finally {
            setIsLoadingProfiles(false);
        }
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/') || file.type === 'application/pdf'
        );
        if (droppedFiles.length + files.length > MAX_FILES) {
            setError(t('maxFilesError', { max: MAX_FILES }) || `Можно загрузить не более ${MAX_FILES} файла(ов)`);
            return;
        }
        setFiles(prev => [...prev, ...droppedFiles].slice(0, MAX_FILES));
        setError(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files).filter(file => 
                file.type.startsWith('image/') || file.type === 'application/pdf'
            );
            if (selectedFiles.length + files.length > MAX_FILES) {
                setError(t('maxFilesError', { max: MAX_FILES }) || `Можно загрузить не более ${MAX_FILES} файла(ов)`);
                return;
            }
            setFiles(prev => [...prev, ...selectedFiles].slice(0, MAX_FILES));
            setError(null);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleStartAnalysis = async () => {
        if (files.length === 0 || !isAgreed) return;

        setUploadStatus('uploading');
        setError(null);

        try {
            const resolvedPatientId = selectedProfileId === 'new' ? null : selectedProfileId;
            let targetUid = '';

            // Загружаем файлы по очереди
            for (let i = 0; i < files.length; i++) {
                const isFirst = (i === 0);
                const data = await uploadAnalysis(files[i], resolvedPatientId, isFirst);
                
                // Сохраняем UID первого файла для дальнейшего редиректа
                if (isFirst) {
                    targetUid = data.uid;
                }
            }
            
            setUploadStatus('idle');
            
            // LAZY PROCESSING LOGIC:
            // Если авторизован -> идем на страницу анализа (нейросеть уже запущена на бэке)
            // Если гость -> идем на claim для привязки email (нейросеть ждет подтверждения)
            router.push(isAuth ? `/analysis/${targetUid}` : `/claim/${targetUid}`);
            
        } catch (error: any) {
            setUploadStatus('error');
            
            // ПЕРЕХВАТ ЛИМИТОВ: Открываем Paywall
            if (error.response?.status === 403 && error.response?.data?.message === 'limit_reached') {
                setPaywallOpen(true);
                setError(null);
            } else {
                setError(t('uploadError') || 'Произошла ошибка при загрузке. Попробуйте еще раз.');
            }
        }
    };

    return (
        <main className="min-h-screen bg-background relative overflow-hidden pb-20">
            <StaticBackground imageUrl="/background/analisis.png" />
            
            <div className="relative z-10 max-w-3xl mx-auto px-4 pt-12">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-primary mb-4 tracking-tight">
                        {t('title') || 'Загрузка бланка'}
                    </h1>
                    <p className="text-lg text-gray-600 max-w-xl mx-auto">
                        {t('subtitle') || 'Загрузите фото или PDF-файл с результатами анализов.'}
                    </p>
                </div>

                {/* Drag & Drop Зона */}
                <div 
                    className={clsx(
                        "relative bg-white/60 backdrop-blur-md border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 shadow-sm",
                        isDragging ? "border-secondary bg-secondary/5 scale-[1.02]" : "border-gray-300 hover:border-secondary/50",
                        files.length >= MAX_FILES && "opacity-50 pointer-events-none"
                    )}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        multiple
                        onChange={handleFileChange}
                    />
                    
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2 shadow-inner">
                            <UploadCloud className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-semibold text-primary">
                            {t('dragDropText') || 'Перетащите файлы сюда'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            {t('formatHint') || 'JPEG, PNG, PDF'} • {isAuth ? 'До 3 файлов' : 'Максимум 1 файл'}
                        </p>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={files.length >= MAX_FILES}
                            className="bg-white border border-gray-200 text-primary px-8 py-3 rounded-xl font-medium hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
                        >
                            {t('browseFiles') || 'Выбрать файлы'}
                        </button>
                    </div>
                </div>

                {/* Ошибка лимитов или загрузки */}
                {error && (
                    <div className="mt-6 flex items-start gap-3 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 animate-in fade-in">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Список загруженных файлов */}
                {files.length > 0 && (
                    <div className="mt-8 space-y-3">
                        {files.map((file, idx) => (
                            <div key={`${file.name}-${idx}`} className="flex items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm group">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 mr-4">
                                    {file.type === 'application/pdf' ? <FileText className="w-6 h-6" /> : <FileImage className="w-6 h-6" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-primary truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button 
                                    onClick={() => removeFile(idx)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Выбор профиля пациента (Только для авторизованных) */}
                {isAuth && files.length > 0 && (
                    <div className="mt-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-secondary" />
                            {t('selectProfile') || 'Кому принадлежит анализ?'}
                        </h3>
                        
                        {isLoadingProfiles ? (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" /> Загрузка профилей...
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {profiles.map(p => (
                                    <label key={p.id} className={clsx(
                                        "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        selectedProfileId === p.id ? "border-secondary bg-secondary/5" : "border-gray-100 hover:border-gray-200"
                                    )}>
                                        <input 
                                            type="radio" 
                                            name="profile" 
                                            className="hidden"
                                            checked={selectedProfileId === p.id}
                                            onChange={() => setSelectedProfileId(p.id)}
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-primary">{p.full_name}</p>
                                            <p className="text-xs text-gray-500">
                                                {p.gender === 'M' ? 'Муж.' : p.gender === 'F' ? 'Жен.' : ''} 
                                                {p.birth_date ? ` • ${p.birth_date}` : ''}
                                            </p>
                                        </div>
                                        <div className={clsx(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                            selectedProfileId === p.id ? "border-secondary" : "border-gray-300"
                                        )}>
                                            {selectedProfileId === p.id && <div className="w-2.5 h-2.5 bg-secondary rounded-full" />}
                                        </div>
                                    </label>
                                ))}
                                
                                <label className={clsx(
                                    "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                                    selectedProfileId === 'new' ? "border-secondary bg-secondary/5" : "border-gray-100 hover:border-gray-200"
                                )}>
                                    <input 
                                        type="radio" 
                                        name="profile" 
                                        className="hidden"
                                        checked={selectedProfileId === 'new'}
                                        onChange={() => setSelectedProfileId('new')}
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-primary">{t('newProfile') || 'Новый пациент'}</p>
                                        <p className="text-xs text-gray-500">{t('newProfileDesc') || 'Создать новую медицинскую карту'}</p>
                                    </div>
                                    <div className={clsx(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                        selectedProfileId === 'new' ? "border-secondary" : "border-gray-300"
                                    )}>
                                        {selectedProfileId === 'new' && <div className="w-2.5 h-2.5 bg-secondary rounded-full" />}
                                    </div>
                                </label>
                            </div>
                        )}
                    </div>
                )}

                {/* Чекбокс согласия с политикой */}
                {files.length > 0 && (
                    <div className="mt-6 flex items-start gap-3 bg-white/50 p-4 rounded-xl border border-gray-100">
                        <input 
                            type="checkbox" 
                            id="agreement" 
                            checked={isAgreed}
                            onChange={(e) => setIsAgreed(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-secondary focus:ring-secondary"
                        />
                        <label htmlFor="agreement" className="text-sm text-gray-600 leading-relaxed cursor-pointer select-none">
                            {t('agreementText')} 
                            <Link href="/terms" className="text-secondary hover:text-secondary/80 font-semibold underline decoration-secondary/30 underline-offset-2 mx-1">
                                {t('termsLink')}
                            </Link>
                            {t('agreementTextAnd')}
                            <Link href="/legal" className="text-secondary hover:text-secondary/80 font-semibold underline decoration-secondary/30 underline-offset-2 ml-1">
                                {t('privacyLink')}
                            </Link>
                        </label>
                    </div>
                )}

                {/* Финальная кнопка */}
                {files.length > 0 && (
                    <div className="mt-6">
                        <button 
                            onClick={handleStartAnalysis}
                            disabled={uploadStatus === 'uploading' || !isAgreed}
                            className={clsx(
                                "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all shadow-lg text-lg",
                                uploadStatus === 'uploading' || !isAgreed
                                    ? "bg-accent/30 cursor-not-allowed shadow-none" 
                                    : "bg-secondary hover:bg-secondary/90 hover:shadow-secondary/30 hover:-translate-y-0.5"
                            )}
                        >
                            {uploadStatus === 'uploading' ? (
                                <><Loader2 className="w-6 h-6 animate-spin" /> {t('sending') || 'Отправка...'}</>
                            ) : (
                                <><Activity className="w-6 h-6" /> {t('startAnalysis') || 'Начать анализ'}</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}