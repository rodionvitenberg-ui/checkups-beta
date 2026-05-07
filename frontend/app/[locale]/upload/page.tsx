'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import { UploadCloud, FileText, Loader2, AlertCircle, Trash2, FileImage, User, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import { uploadAnalysis, getProfiles } from '@/lib/api';
import { PatientProfile } from '@/lib/types';
import StaticBackground from '@/components/background/StaticBackground';
import { sharedFileStore } from '@/lib/store';
import { useTranslations } from 'next-intl';

export default function UploadPage() {
    const router = useRouter();
    const t = useTranslations('Upload');
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const MAX_FILES = 1;

    const [isAuth, setIsAuth] = useState(false);
    const [profiles, setProfiles] = useState<PatientProfile[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<number | 'new' | null>(null);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

    // Оставили только имя
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
            setFiles(sharedFileStore.files.slice(0, MAX_FILES));
            sharedFileStore.files = []; 
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
        
        // Валидация: проверяем только имя
        if ((!isAuth || selectedProfileId === 'new') && !guestName) {
            setError(t('errors.fillAllFields'));
            return;
        }

        setUploadStatus('uploading');
        setError(null);

        try {
            const file = files[0]; 
            const formData = new FormData();
            formData.append('file', file);
            formData.append('is_first', 'true'); 

            if (isAuth) {
                if (selectedProfileId === 'new') {
                    // Авторизованный юзер создает новый профиль
                    formData.append('patient_id', 'new');
                    formData.append('guest_name', guestName);
                } else if (selectedProfileId) {
                    // Авторизованный юзер выбрал существующий профиль
                    formData.append('patient_id', selectedProfileId.toString());
                }
            } else {
                // Гость (неавторизован)
                formData.append('guest_name', guestName);
            }

            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const headers: Record<string, string> = {};
            const token = localStorage.getItem('token');
            if (token) headers['Authorization'] = `Bearer ${token}`;
            headers['Accept-Language'] = document.documentElement.lang || 'ru'; 

            const response = await fetch(`${baseUrl}/analyses/upload`, {
                method: 'POST',
                headers,
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || t('errors.uploadFailed'));
            }

            const result = await response.json();
            const idsString = result.uid; 

            if (isAuth) {
                localStorage.setItem('new_analysis_ids', JSON.stringify([idsString]));
            }
            
            router.push(`/claim/${idsString}`);

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
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">{t('title')}</h1>
                    <p className="text-slate-600 font-medium">{t('subtitle', { max: MAX_FILES })}</p>
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,image/png,image/jpeg" />

                {/* --- ЗОНА ЗАГРУЗКИ ФАЙЛА --- */}
                {files.length < MAX_FILES && (
                    <div 
                        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={clsx(
                            "group relative overflow-hidden cursor-pointer border-2 border-dashed rounded-2xl p-8 mb-6 transition-all duration-300 ease-in-out bg-white/50 backdrop-blur-md",
                            isDragging ? "border-blue-500 bg-blue-50/50 scale-[1.02] shadow-inner" : "border-slate-300 hover:border-blue-400 hover:bg-white/80"
                        )}
                    >
                        <div className="text-center">
                            <div className={clsx(
                                "mx-auto w-16 h-16 mb-4 rounded-xl flex items-center justify-center transition-colors shadow-sm border border-white/60",
                                isDragging ? "bg-blue-100 text-blue-600" : "bg-white text-slate-400 group-hover:text-blue-500 group-hover:shadow-md"
                            )}>
                                {isDragging ? <FileText className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-1">
                                {isDragging ? t('dropFiles') : t('addMore')}
                            </h3>
                            <p className="text-slate-500 font-medium text-xs">{t('fileFormat')}</p>
                        </div>
                    </div>
                )}

                {/* --- ВЫБРАННЫЙ ФАЙЛ --- */}
                {files.length > 0 && (
                    <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">{t('documentLabel')}</h3>
                        {files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white/80 border border-slate-200 rounded-xl shadow-sm">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 text-blue-600">
                                        {file.type === 'application/pdf' ? <FileText className="w-5 h-5" /> : <FileImage className="w-5 h-5" />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">{formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                                <button onClick={() => removeFile(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}

                        {/* --- ФОРМА ПРИВЯЗКИ ПАЦИЕНТА --- */}
                        <div className="mt-6 p-6 bg-white/60 border border-white/60 rounded-2xl shadow-sm">
                            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" />
                                {t('profile.title')}
                            </h3>
                            
                            {isLoadingProfiles ? (
                                <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                            ) : (
                                <div className="space-y-4">
                                    {isAuth && (
                                        <div className="space-y-2">
                                            <select 
                                                value={selectedProfileId || ''} 
                                                onChange={(e) => setSelectedProfileId(e.target.value === 'new' ? 'new' : Number(e.target.value))}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-medium shadow-sm cursor-pointer"
                                            >
                                                {profiles.map(p => (
                                                    <option key={p.id} value={p.id}>{p.full_name}</option>
                                                ))}
                                                <option value="new" className="font-bold text-blue-600">
                                                    + {t('profile.createNew')}
                                                </option>
                                            </select>
                                        </div>
                                    )}

                                    {(!isAuth || selectedProfileId === 'new') && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <p className="text-xs font-medium text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                {isAuth ? t('profile.newProfileHint') : t('profile.guestHint')}
                                            </p>
                                            
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{t('profile.nameLabel')}</label>
                                                <input 
                                                    type="text" 
                                                    placeholder={t('profile.namePlaceholder')}
                                                    value={guestName}
                                                    onChange={(e) => setGuestName(e.target.value)}
                                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                <button 
                    onClick={handleStartAnalysis}
                    disabled={uploadStatus === 'uploading' || files.length === 0}
                    className={clsx(
                        "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all shadow-lg text-lg",
                        uploadStatus === 'uploading' || files.length === 0
                            ? "bg-slate-300 cursor-not-allowed shadow-none" 
                            : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30 hover:-translate-y-0.5"
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