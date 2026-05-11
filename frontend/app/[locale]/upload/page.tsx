'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import Image from 'next/image';
import { UploadCloud, FileText, Loader2, AlertCircle, Trash2, FileImage, User, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import { getProfiles } from '@/lib/api';
import { PatientProfile } from '@/lib/types';
import StaticBackground from '@/components/background/StaticBackground';
import { sharedFileStore } from '@/lib/store';
import { useTranslations } from 'next-intl';
import { useStore } from '@/lib/store';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: `${t('uploadTitle')} | webdoc.life`,
  };
}

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

    // ДИНАМИЧЕСКИЙ ЛИМИТ: 3 для авторизованных, 1 для гостей
    const MAX_FILES = isAuth ? 3 : 1;

    // Оставили только имя (теперь используется только авторизованными при создании нового)
    const [guestName, setGuestName] = useState('');

    useEffect(() => {
        const checkAuthAndLoadProfiles = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                setIsAuth(true);
                try {
                    const fetchedProfiles = await getProfiles();
                    setProfiles(fetchedProfiles);
                    if (fetchedProfiles.length > 0) {
                        setSelectedProfileId(fetchedProfiles[0].id);
                    }
                } catch (err) {
                    console.error("Failed to fetch profiles", err);
                    setIsAuth(false); 
                }
            }
            setIsLoadingProfiles(false);
        };

        checkAuthAndLoadProfiles();

        if (sharedFileStore.files.length > 0) {
            setFiles(sharedFileStore.files.slice(0, isAuth ? 3 : 1));
            sharedFileStore.files = []; 
        }
    }, [isAuth]);

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
                setError(t('errors.maxFiles', { max: MAX_FILES }));
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
        
        // Валидация: проверяем имя ТОЛЬКО если авторизованный юзер создает новый профиль
        if (isAuth && selectedProfileId === 'new' && !guestName) {
            setError(t('errors.fillAllFields'));
            return;
        }

        setUploadStatus('uploading');
        setError(null);

        try {
            let targetUid = '';
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const headers: Record<string, string> = {};
            const token = localStorage.getItem('token');
            if (token) headers['Authorization'] = `Bearer ${token}`;
            headers['Accept-Language'] = document.documentElement.lang || 'ru'; 

            // ЦИКЛ: Загружаем файлы по очереди
            for (let i = 0; i < files.length; i++) {
                const file = files[i]; 
                const isFirst = (i === 0);
                const formData = new FormData();
                formData.append('file', file);
                formData.append('is_first', isFirst ? 'true' : 'false'); 

                // Привязка профиля только для авторизованных
                if (isAuth) {
                    if (selectedProfileId === 'new') {
                        formData.append('patient_id', 'new');
                        formData.append('guest_name', guestName);
                    } else if (selectedProfileId) {
                        formData.append('patient_id', selectedProfileId.toString());
                    }
                }
                // Для гостей ничего не передаем — бэкенд сам разберется на этапе Claim

                const response = await fetch(`${baseUrl}/analyses/upload`, {
                    method: 'POST',
                    headers,
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    
                    // ПЕРЕХВАТ ЛИМИТОВ: Открываем Paywall
                    if (response.status === 403 && errorData.message === 'limit_reached') {
                        setPaywallOpen(true);
                        setUploadStatus('idle');
                        return; // Прерываем процесс, ничего не переключаем
                    }
                    
                    throw new Error(errorData.message || t('errors.uploadFailed'));
                }

                const result = await response.json();
                
                if (isFirst) {
                    targetUid = result.uid; 
                }
            }

            if (isAuth) {
                localStorage.setItem('new_analysis_ids', JSON.stringify([targetUid]));
            }
            
            // LAZY PROCESSING: Гостей отправляем на claim, своих — на анализ
            setUploadStatus('idle');
            router.push(isAuth ? `/analysis/${targetUid}` : `/claim/${targetUid}`);

        } catch (err: any) {
            console.error(err);
            setError(err.message || t('errors.defaultError'));
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
            
            <div className="relative z-10 w-full max-w-2xl mx-auto bg-transparent backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl border border-white/20">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <div className="relative w-35 h-35">
                            <Image src="/done.png" alt="Готово" fill className="object-contain drop-shadow-sm" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-accent tracking-tight mb-2">{t('title')}</h1>
                    <p className="text-accent/80 font-medium">{t('subtitle', { max: MAX_FILES })}</p>
                </div>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept=".pdf,image/png,image/jpeg" 
                    multiple={MAX_FILES > 1}
                />

                {/* --- ЗОНА ЗАГРУЗКИ ФАЙЛА --- */}
                {files.length < MAX_FILES && (
                    <div 
                        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={clsx(
                            "group relative overflow-hidden cursor-pointer border-2 border-dashed rounded-2xl p-8 mb-6 transition-all duration-300 ease-in-out bg-white/50 backdrop-blur-md",
                            isDragging ? "border-secondary bg-secondary/10 scale-[1.02] shadow-inner" : "border-accent/30 hover:border-secondary hover:bg-white/80"
                        )}
                    >
                        <div className="text-center">
                            <div className={clsx(
                                "mx-auto w-16 h-16 mb-4 rounded-xl flex items-center justify-center transition-colors shadow-sm border border-white/60",
                                isDragging ? "bg-secondary/20 text-card" : "bg-white text-accent/50 group-hover:text-card group-hover:shadow-md"
                            )}>
                                {isDragging ? <FileText className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
                            </div>
                            <h3 className="text-lg font-bold text-accent mb-1">
                                {isDragging ? t('dropFiles') : t('addMore')}
                            </h3>
                            <p className="text-accent/70 font-medium text-xs">{t('fileFormat')}</p>
                        </div>
                    </div>
                )}

                {/* --- ВЫБРАННЫЙ ФАЙЛ --- */}
                {files.length > 0 && (
                    <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-sm font-bold text-accent/70 uppercase tracking-wider px-1">{t('documentLabel')}</h3>
                        {files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white/80 border border-accent/20 rounded-xl shadow-sm">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20 text-card">
                                        {file.type === 'application/pdf' ? <FileText className="w-5 h-5" /> : <FileImage className="w-5 h-5" />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-accent truncate">{file.name}</p>
                                        <p className="text-xs text-accent/70 font-medium mt-0.5">{formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                                <button onClick={() => removeFile(idx)} className="p-2 text-accent/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}

                        {/* --- ФОРМА ПРИВЯЗКИ ПАЦИЕНТА (ТОЛЬКО ДЛЯ АВТОРИЗОВАННЫХ) --- */}
                        {isAuth && (
                            <div className="mt-6 p-6 bg-white/60 border border-white/60 rounded-2xl shadow-sm">
                                <h3 className="text-base font-bold text-accent mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-card" />
                                    {t('profile.title')}
                                </h3>
                                
                                {isLoadingProfiles ? (
                                    <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-card" /></div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <select 
                                                value={selectedProfileId || ''} 
                                                onChange={(e) => setSelectedProfileId(e.target.value === 'new' ? 'new' : Number(e.target.value))}
                                                className="w-full p-3 bg-white border border-accent/20 rounded-xl focus:ring-2 focus:ring-secondary outline-none text-accent/90 font-medium shadow-sm cursor-pointer"
                                            >
                                                {profiles.map(p => (
                                                    <option key={p.id} value={p.id}>{p.full_name}</option>
                                                ))}
                                                <option value="new" className="font-bold text-card">
                                                    + {t('profile.createNew')}
                                                </option>
                                            </select>
                                        </div>

                                        {selectedProfileId === 'new' && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                                <p className="text-xs font-medium text-accent/90 bg-secondary/10 p-3 rounded-lg border border-secondary/20">
                                                    {t('profile.newProfileHint')}
                                                </p>
                                                
                                                <div>
                                                    <label className="block text-xs font-bold text-accent uppercase mb-1.5">{t('profile.nameLabel')}</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder={t('profile.namePlaceholder')}
                                                        value={guestName}
                                                        onChange={(e) => setGuestName(e.target.value)}
                                                        className="w-full p-3 bg-white border border-accent/20 rounded-xl focus:ring-2 focus:ring-secondary outline-none text-sm text-accent shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                {/* --- НОВЫЙ БЛОК: ЧЕКБОКС СОГЛАСИЯ --- */}
                {files.length > 0 && (
                    <div className="mb-6 flex items-start gap-3 px-1 animate-in fade-in">
                        <div className="flex items-center h-5 mt-0.5">
                            <input
                                id="terms-checkbox"
                                type="checkbox"
                                checked={isAgreed}
                                onChange={(e) => setIsAgreed(e.target.checked)}
                                className="w-4 h-4 text-secondary bg-white border-accent/30 rounded focus:ring-secondary focus:ring-2 cursor-pointer transition-colors"
                            />
                        </div>
                        <label htmlFor="terms-checkbox" className="text-sm text-accent/70 leading-snug cursor-pointer select-none">
                            {t('agreementText')}
                            <Link href="/terms" className="text-secondary hover:text-secondary/80 font-semibold underline decoration-secondary/30 underline-offset-2 mx-1">
                                {t('termsLink')}
                            </Link>
                            {t('and')}
                            <Link href="/legal" className="text-secondary hover:text-secondary/80 font-semibold underline decoration-secondary/30 underline-offset-2 ml-1">
                                {t('privacyLink')}
                            </Link>
                        </label>
                    </div>
                )}
                {/* --------------------------------------- */}

                <button 
                    onClick={handleStartAnalysis}
                    // КНОПКА ЗАБЛОКИРОВАНА, ЕСЛИ НЕ СТОИТ ГАЛОЧКА (!isAgreed)
                    disabled={uploadStatus === 'uploading' || files.length === 0 || !isAgreed}
                    className={clsx(
                        "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all shadow-lg text-lg",
                        uploadStatus === 'uploading' || files.length === 0 || !isAgreed
                            ? "bg-accent/30 cursor-not-allowed shadow-none" 
                            : "bg-secondary hover:bg-secondary/90 hover:shadow-secondary/30 hover:-translate-y-0.5"
                    )}
                >
                    {uploadStatus === 'uploading' ? (
                        <><Loader2 className="w-6 h-6 animate-spin" /> {t('sending')}</>
                    ) : (
                        <><Activity className="w-6 h-6" /> {t('startAnalysis')}</>
                    )}
                </button>
            </div>
        </main>
    );
}