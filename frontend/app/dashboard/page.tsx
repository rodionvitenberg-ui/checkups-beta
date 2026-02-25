'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // <-- Импортировали Link
import { 
    Calendar, FileText, Download, ChevronDown, 
    Plus, Loader2, ArrowRight, Trash2, Activity, List, FolderOpen, User, Eye, Edit2, Check, X, LogOut, Key
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/components/ui/toast';
import { 
    getProfiles, 
    getPatientAnalyses, 
    getPatientHistory,
    viewOriginalFile,
    deleteAnalysis,
    deleteProfile,
    updateProfile,
    PatientProfile, 
    AnalysisResponse,
    requestPasswordReset,
} from '@/lib/api';
import { PatientChart } from '@/components/dashboard/PatientChart';
import { pdf } from '@react-pdf/renderer';
import { AnalysisPDF } from '@/components/analysis/AnalysisPDF';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileUploader } from '@/components/home/FileUploader';

// --- Компонент Элемента Списка (Анализа) ---
function AnalysisItem({ analysis, onDeleteSuccess }: { analysis: AnalysisResponse, onDeleteSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [viewing, setViewing] = useState(false);
    const { toast } = useToast();

    const handleDownloadPDF = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!analysis.ai_result) {
            toast({ title: "Внимание", description: "Данные для PDF еще не готовы", variant: "warning" });
            return;
        }
        setDownloading(true);
        try {
            const blob = await pdf(<AnalysisPDF data={analysis} />).toBlob();
            const dateStr = new Date(analysis.created_at || Date.now()).toISOString().split('T')[0];
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Checkups_Report_${dateStr}.pdf`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            toast({ title: "Ошибка", description: "Не удалось создать PDF", variant: "destructive" });
        } finally {
            setDownloading(false);
        }
    };

    const handleViewOriginal = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        setViewing(true);
        try {
            await viewOriginalFile(analysis.uid);
        } catch (error) {
            toast({ title: "Ошибка", description: "Не удалось открыть оригинал", variant: "destructive" });
        } finally {
            setViewing(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!confirm('Вы уверены, что хотите удалить этот анализ? Это действие нельзя отменить.')) return;
        setLoading(true);
        try {
            await deleteAnalysis(analysis.uid);
            toast({ title: "Удалено", description: "Анализ успешно удален", variant: "success" });
            onDeleteSuccess(); 
        } catch (error) {
            toast({ title: "Ошибка", description: "Не удалось удалить анализ", variant: "destructive" });
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 mb-3 group">
            
            {/* Обернули левую часть в Link для перехода на страницу анализа */}
            <Link href={`/analysis/${analysis.uid}`} className="flex items-center gap-4 flex-1 cursor-pointer">
                <div className={clsx(
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0",
                    analysis.status === 'completed' ? "bg-gradient-to-br from-green-50 to-green-100 text-green-600" :
                    analysis.status === 'processing' ? "bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-600" :
                    "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-500"
                )}>
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {analysis.ai_result?.patient_info?.extracted_name 
                            ? `${analysis.ai_result.patient_info.extracted_name} от ` 
                            : 'Анализ от '}
                        {analysis.ai_result?.patient_info?.extracted_date 
                            ? format(new Date(analysis.ai_result.patient_info.extracted_date), 'd MMMM yyyy', { locale: ru }) 
                            : (analysis.created_at ? format(new Date(analysis.created_at), 'd MMMM yyyy', { locale: ru }) : 'Неизвестная дата')
                        }
                    </h4>
                    <span className={clsx(
                        "text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block",
                        analysis.status === 'completed' ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                    )}>
                        {analysis.status === 'completed' ? 'Готов к просмотру' : 'Обработка...'}
                    </span>
                </div>
            </Link>

            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {analysis.status === 'completed' && (
                    <Link href={`/analysis/${analysis.uid}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Открыть расшифровку">
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                )}
                <button onClick={handleViewOriginal} disabled={viewing} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors" title="Посмотреть оригинал">
                    {viewing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                </button>
                {analysis.status === 'completed' && (
                    <button onClick={handleDownloadPDF} disabled={downloading} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" title="Скачать PDF отчет">
                        {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    </button>
                )}
                <button onClick={handleDelete} disabled={loading} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Удалить анализ">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
}

// --- КАРТОЧКА ПРОФИЛЯ ---
function ProfileCard({ profile, isExpanded, onToggle }: { profile: PatientProfile, isExpanded: boolean, onToggle: () => void }) {
    const [activeTab, setActiveTab] = useState<'history' | 'dynamics'>('history');
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(profile.full_name);
    
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isDefaultProfile = profile.full_name === "Анализы" || profile.full_name.includes("Основной");

    const { data: analyses = [], isLoading: isLoadingAnalyses } = useQuery({
        queryKey: ['analyses', profile.id],
        queryFn: () => getPatientAnalyses(profile.id),
        enabled: isExpanded,
    });

    const { data: history = [], isLoading: isLoadingHistory } = useQuery({
        queryKey: ['history', profile.id],
        queryFn: () => getPatientHistory(profile.id),
        enabled: isExpanded && !isDefaultProfile,
    });

    const updateNameMutation = useMutation({
        mutationFn: (newName: string) => updateProfile(profile.id, newName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            setIsEditing(false);
            toast({ title: "Успешно", description: "Имя профиля обновлено", variant: "success" });
        },
        onError: () => toast({ title: "Ошибка", description: "Не удалось переименовать", variant: "destructive" })
    });

    const deleteProfileMutation = useMutation({
        mutationFn: () => deleteProfile(profile.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            toast({ title: "Удалено", description: "Профиль удален", variant: "success" });
        },
        onError: () => toast({ title: "Ошибка", description: "Не удалось удалить профиль", variant: "destructive" })
    });

    const handleSaveName = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        if (editName.trim() && editName !== profile.full_name) {
            updateNameMutation.mutate(editName.trim());
        } else {
            setIsEditing(false);
        }
    };

    const isLoadingData = isLoadingAnalyses || isLoadingHistory;

    return (
        <div className={clsx(
            "bg-white rounded-3xl transition-all duration-500 overflow-hidden",
            isExpanded 
                ? "border-transparent shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-blue-500/10"
                : "border border-slate-200/60 shadow-sm hover:border-blue-200/60 hover:shadow-md"
        )}>
            {/* ШАПКА КАРТОЧКИ */}
            <div 
                onClick={() => { if (!isEditing) onToggle(); setActiveTab('history'); }}
                className={clsx(
                    "w-full flex items-center justify-between p-5 sm:p-6 text-left group cursor-pointer transition-colors",
                    isExpanded ? "bg-blue-50/30" : "bg-transparent"
                )}
                role="button"
            >
                <div className="flex items-center gap-4 sm:gap-5">
                    <div className={clsx(
                        "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-lg transition-all duration-300 shrink-0",
                        isExpanded 
                            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20 scale-105" 
                            : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500"
                    )}>
                        {isDefaultProfile ? <FolderOpen className="w-6 h-6 sm:w-7 sm:h-7" /> : <User className="w-6 h-6 sm:w-7 sm:h-7" />}
                    </div>
                    <div>
                        {isEditing ? (
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <input 
                                    type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                                    className="border-b-2 border-blue-500 bg-transparent text-lg font-bold text-slate-900 focus:outline-none py-1 px-1 min-w-[200px]"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveName(e);
                                        if (e.key === 'Escape') setIsEditing(false);
                                    }}
                                />
                                <button onClick={handleSaveName} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                                    {updateNameMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setIsEditing(false)} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight">
                                    {isDefaultProfile ? 'Анализы (Без привязки)' : profile.full_name}
                                </h3>
                                {!isDefaultProfile && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditName(profile.full_name); }}
                                        className="p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        title="Переименовать"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                            {isDefaultProfile ? "Анализы документов без имени" : "Анализы по данному пациенту"}
                        </div>
                    </div>
                </div>
                {!isEditing && (
                    <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                        isExpanded ? "bg-white shadow-sm" : "bg-slate-50 group-hover:bg-slate-100"
                    )}>
                        <ChevronDown className={clsx("w-5 h-5 text-slate-400 transition-transform duration-300", isExpanded && "rotate-180 text-blue-600")} />
                    </div>
                )}
            </div>

            {/* КОНТЕНТ КАРТОЧКИ */}
            <div className={clsx(
                "transition-all duration-500 ease-in-out border-t border-slate-100/50 relative",
                isExpanded ? "max-h-[2000px] opacity-100 bg-slate-50/30" : "max-h-0 opacity-0"
            )}>
                <div className="p-5 sm:p-6">
                    <div className="flex gap-6 mb-6 border-b border-slate-200">
                        <button onClick={() => setActiveTab('history')} className={clsx("pb-3 text-sm font-semibold transition-all flex items-center gap-2 relative", activeTab === 'history' ? "text-blue-600" : "text-slate-500 hover:text-slate-800")}>
                            <List className="w-4 h-4" /> Список документов
                            {activeTab === 'history' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                        {!isDefaultProfile && (
                            <button onClick={() => setActiveTab('dynamics')} className={clsx("pb-3 text-sm font-semibold transition-all flex items-center gap-2 relative", activeTab === 'dynamics' ? "text-blue-600" : "text-slate-500 hover:text-slate-800")}>
                                <Activity className="w-4 h-4" /> Динамика показателей
                                {activeTab === 'dynamics' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                            </button>
                        )}
                    </div>

                    {isLoadingData ? (
                        <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600/50 animate-spin" /></div>
                    ) : (
                        <>
                            {activeTab === 'history' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    {analyses.length === 0 ? (
                                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <FileText className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-medium">Пока нет загруженных анализов</p>
                                        </div>
                                    ) : (
                                        analyses.map((analysis: AnalysisResponse) => (
                                            <AnalysisItem 
                                                key={analysis.uid} analysis={analysis} 
                                                onDeleteSuccess={() => queryClient.invalidateQueries({ queryKey: ['analyses', profile.id] })} 
                                            />
                                        ))
                                    )}
                                </div>
                            )}
                            {activeTab === 'dynamics' && !isDefaultProfile && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-sm">
                                    <PatientChart history={history} />
                                </div>
                            )}
                        </>
                    )}

                    {!isDefaultProfile && (
                        <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={() => { if (confirm('Удалить пациента и все его анализы?')) deleteProfileMutation.mutate(); }}
                                disabled={deleteProfileMutation.isPending}
                                className="text-xs sm:text-sm text-slate-400 hover:text-red-500 font-medium flex items-center gap-1.5 hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
                            >
                                {deleteProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Удалить профиль
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- ОСНОВНАЯ СТРАНИЦА ДАШБОРДА ---
export default function DashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [expandedProfileId, setExpandedProfileId] = useState<number | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    
    // Новое состояние для модалки загрузки
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const { data: profiles = [], isLoading } = useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const data = await getProfiles();
            return data.sort((a, b) => {
                if (a.full_name === "Анализы" || a.full_name.includes("Основной")) return -1;
                if (b.full_name === "Анализы" || b.full_name.includes("Основной")) return 1;
                return 0;
            });
        }
    });

    if (!isLoading && profiles.length > 0 && expandedProfileId === null) {
        setExpandedProfileId(profiles[0].id);
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_email');
        window.dispatchEvent(new Event('auth-change'));
        router.push('/'); 
    };

    const handleChangePassword = async () => {
        const email = localStorage.getItem('user_email');
        if (!email) {
            toast({ title: 'Ошибка', description: 'Не удалось найти email пользователя.', variant: 'destructive' });
            return;
        }

        setIsResetting(true);
        try {
            await requestPasswordReset(email);
            toast({ 
                title: 'Ссылка отправлена!', 
                description: 'Мы отправили инструкцию по смене пароля на вашу почту.' 
            });
        } catch (error) {
            toast({ 
                title: 'Ошибка', 
                description: 'Не удалось отправить запрос. Попробуйте позже.', 
                variant: 'destructive' 
            });
        } finally {
            setIsResetting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Загрузка данных...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 tracking-tight">
                            Кабинет
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">Управление вашими документами и профилями</p>
                    </div>
                    
                    {/* Кнопка теперь открывает модалку, а не делает редирект */}
                    <button 
                        onClick={() => setIsUploadModalOpen(true)} 
                        className="group flex items-center justify-center gap-2 bg-secondary text-white px-6 py-3 rounded-2xl hover:bg-accent hover:text-black transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 font-semibold w-full sm:w-auto"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        <span>Загрузить анализ</span>
                    </button>
                </div>

                {/* СПИСОК ПРОФИЛЕЙ */}
                <div className="space-y-5">
                    {profiles.map((profile) => (
                        <ProfileCard 
                            key={profile.id} 
                            profile={profile} 
                            isExpanded={expandedProfileId === profile.id}
                            onToggle={() => setExpandedProfileId(prev => prev === profile.id ? null : profile.id)}
                        />
                    ))}
                </div>

                {/* НАСТРОЙКИ АККАУНТА */}
                <div className="mt-12 pt-8 border-t border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Настройки аккаунта</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={handleChangePassword}
                            disabled={isResetting}
                            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-70"
                        >
                            {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5 text-slate-400" />}
                            Сменить пароль
                        </button>
                        
                        <button 
                            onClick={handleLogout}
                            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                        >
                            <LogOut className="w-5 h-5 text-red-500" />
                            Выйти из системы
                        </button>
                    </div>
                </div>

                {/* --- МОДАЛЬНОЕ ОКНО ЗАГРУЗКИ --- */}
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
                            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                                <h3 className="text-xl font-bold text-slate-900">Загрузка анализа</h3>
                                <button 
                                    onClick={() => setIsUploadModalOpen(false)} 
                                    className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1.5 shadow-sm border border-slate-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6">
                                {/* Наш готовый компонент загрузки */}
                                <FileUploader /> 
                            </div>
                        </div>
                    </div>
                )}
                {/* ------------------------------- */}

            </div>
        </div>
    );
}