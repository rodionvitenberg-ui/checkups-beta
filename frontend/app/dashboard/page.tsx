'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import StaticBackground from '@/components/background/StaticBackground';
import { ChangePasswordModal } from '@/components/dashboard/ChangePasswordModal';

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
        // 1. Открываем окно САМЫМ ПЕРВЫМ действием! 
        // До любых preventDefault() и stopPropagation(), иначе Safari блокирует окно.
        const newWindow = window.open('', '_blank');
        
        e.preventDefault(); 
        e.stopPropagation();
        
        setViewing(true);
        try {
            const fileUrl = await viewOriginalFile(analysis.uid);
            
            if (newWindow) {
                newWindow.location.href = fileUrl;
            } else {
                window.location.href = fileUrl;
            }
            
            setTimeout(() => URL.revokeObjectURL(fileUrl), 10000);
        } catch (error) {
            if (newWindow) newWindow.close();
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
        // Добавлено стекло: bg-white/80 backdrop-blur-md border-white/40
        <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl hover:border-secondary hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 mb-3 group">
            
            <Link href={`/analysis/${analysis.uid}`} className="flex items-center gap-4 flex-1 cursor-pointer">
                <div className={clsx(
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0",
                    analysis.status === 'completed' ? "bg-gradient-to-br from-[#00be64]/10 to-[#00be64]/20 text-[#00be64]" :
                    analysis.status === 'processing' ? "bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-600" :
                    "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-500"
                )}>
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[#3f94ca] transition-colors">
                        {analysis.ai_result?.patient_info?.extracted_name 
                            ? `${analysis.ai_result.patient_info.extracted_name} от ` 
                            : 'Анализ от '}
                        {(() => {
                            const extDate = analysis.ai_result?.patient_info?.extracted_date;
                            let d = analysis.created_at ? new Date(analysis.created_at) : new Date();
                            if (extDate) {
                                const parsed = new Date(extDate);
                                if (!isNaN(parsed.getTime())) {
                                    d = parsed;
                                } else if (extDate.includes('.')) {
                                    const parts = extDate.split('.');
                                    if (parts.length === 3) {
                                        const parsed2 = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                                        if (!isNaN(parsed2.getTime())) d = parsed2;
                                    }
                                }
                            }
                            return format(d, 'd MMMM yyyy', { locale: ru });
                        })()}
                    </h4>
                    <span className={clsx(
                        "text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block",
                        analysis.status === 'completed' ? "bg-[#00be64]/10 text-[#00be64]" : "bg-yellow-50 text-yellow-600"
                    )}>
                        {analysis.status === 'completed' ? 'Готов к просмотру' : 'Обработка...'}
                    </span>
                </div>
            </Link>

            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {analysis.status === 'completed' && (
                    <Link href={`/analysis/${analysis.uid}`} className="p-2 text-slate-400 hover:text-[#3f94ca] hover:bg-[#3f94ca]/10 rounded-xl transition-colors" title="Открыть расшифровку">
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                )}
                <button 
                    type="button" // <--- ДОБАВИТЬ ЭТО
                    onClick={handleViewOriginal} 
                    disabled={viewing} 
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 rounded-xl transition-colors" 
                    title="Посмотреть оригинал"
                >
                    {viewing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                </button>
                {analysis.status === 'completed' && (
                    <button onClick={handleDownloadPDF} disabled={downloading} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-colors" title="Скачать PDF отчет">
                        {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    </button>
                )}
                <button onClick={handleDelete} disabled={loading} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-colors" title="Удалить анализ">
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

    const handleSaveName = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        if (editName.trim() && editName !== profile.full_name) {
            updateNameMutation.mutate(editName.trim());
        } else {
            setIsEditing(false); // Если ничего не изменилось, просто закрываем редактирование
        }
    };

    const deleteProfileMutation = useMutation({
        // 1. Явно указываем, что мутация принимает параметр id (число)
        mutationFn: (id: number) => deleteProfile(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            toast({ title: "Удалено", description: "Профиль удален", variant: "success" });
        },
        onError: () => toast({ title: "Ошибка", description: "Не удалось удалить профиль", variant: "destructive" })
    });

    const isLoadingData = isLoadingAnalyses || isLoadingHistory;

    return (
        <div className={clsx(
            "bg-white/70 backdrop-blur-md rounded-3xl transition-all duration-500 overflow-hidden",
            isExpanded 
                ? "border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-[#3f94ca]/20"
                : "border border-white/40 shadow-sm hover:border-[#3f94ca]/40 hover:bg-white/80 hover:shadow-md"
        )}>
            {/* ШАПКА КАРТОЧКИ */}
            <div 
                // Тап по всей шапке (в т.ч. по имени) разворачивает карточку
                onClick={() => { if (!isEditing) onToggle(); setActiveTab('history'); }}
                className={clsx(
                    "w-full flex items-center justify-between p-6 sm:p-6 text-left group cursor-pointer transition-colors",
                    isExpanded ? "bg-[#3f94ca]/5" : "bg-transparent"
                )}
                role="button"
            >
                <div className="flex items-center gap-4 sm:gap-5 w-full overflow-hidden">
                    
                    {/* ИКОНКА / КНОПКА РЕДАКТИРОВАНИЯ */}
                    <div className={clsx(
                        "w-10 h-10 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-lg transition-all duration-300 shrink-0",
                        isExpanded 
                            ? "bg-gradient-to-br from-[#3f94ca] to-secondary text-white scale-100" 
                            : "bg-white/60 text-slate-500 group-hover:bg-[#3f94ca]/10 group-hover:text-[#3f94ca]",
                        // Перекрашиваем квадрат в зеленый цвет на мобилке, если включен режим редактирования (для галочки)
                        isEditing && !isDefaultProfile && "max-sm:!bg-gradient-to-br max-sm:!from-[#00be64] max-sm:!to-[#00a859] max-sm:!text-white max-sm:!shadow-lg max-sm:!shadow-[#00be64]/30 max-sm:!scale-100"
                    )}>
                        {isDefaultProfile ? (
                            <FolderOpen className="w-6 h-6 sm:w-7 sm:h-7" />
                        ) : (
                            <>
                                {/* ДЕСКТОП: Обычная иконка пользователя */}
                                <User className="hidden sm:block w-6 h-6 sm:w-7 sm:h-7" />
                                
                                {/* МОБИЛКА: Интерактивная кнопка карандаш -> галочка */}
                                <div 
                                    className="sm:hidden w-full h-full flex items-center justify-center"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Не даем карточке развернуться при тапе на иконку
                                        if (isEditing) {
                                            handleSaveName(e);
                                        } else {
                                            setIsEditing(true);
                                            setEditName(profile.full_name);
                                        }
                                    }}
                                >
                                    {updateNameMutation.isPending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : isEditing ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <Edit2 className="w-5 h-5" />
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* ТЕКСТ / ПОЛЕ ВВОДА */}
                    <div className="flex-1 overflow-hidden">
                        {isEditing ? (
                            <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                                <input 
                                    type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                                    className="border-b-2 border-[#3f94ca] bg-white/50 text-base sm:text-lg font-bold text-slate-900 focus:outline-none py-1 px-2 w-full sm:min-w-[200px] rounded-t-md"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveName(e);
                                        if (e.key === 'Escape') setIsEditing(false);
                                    }}
                                />
                                {/* ДЕСКТОП: Кнопки сохранения и отмены (скрыты на мобилках) */}
                                <div className="hidden sm:flex items-center gap-1 shrink-0">
                                    <button onClick={handleSaveName} className="p-1.5 bg-[#00be64]/20 text-[#00be64] rounded-lg hover:bg-[#00be64]/30 transition-colors">
                                        {updateNameMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="p-1.5 bg-slate-200/50 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight truncate">
                                    {isDefaultProfile ? 'Анализы (Без привязки)' : profile.full_name}
                                </h3>
                                {/* ДЕСКТОП: Кнопка карандаша (скрыта на мобилках) */}
                                {!isDefaultProfile && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditName(profile.full_name); }}
                                        className="hidden sm:block p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-[#3f94ca] hover:bg-[#3f94ca]/10 rounded-xl transition-all shrink-0"
                                        title="Переименовать"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="text-xs sm:text-sm text-slate-500 mt-1 font-medium truncate">
                            {isDefaultProfile ? "Анализы документов без имени" : "Анализы по данному пациенту"}
                        </div>
                    </div>
                </div>

                {/* СТРЕЛОЧКА РАЗВОРОТА (Скрывается во время редактирования) */}
                {!isEditing && (
                    <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ml-2",
                        isExpanded ? "bg-white shadow-sm" : "bg-white/50 group-hover:bg-white"
                    )}>
                        <ChevronDown className={clsx("w-5 h-5 text-slate-400 transition-transform duration-300", isExpanded && "rotate-180 text-[#3f94ca]")} />
                    </div>
                )}
            </div>

            {/* КОНТЕНТ КАРТОЧКИ */}
            <div className={clsx(
                "transition-all duration-500 ease-in-out border-t border-white/40 relative",
                isExpanded ? "max-h-[2000px] opacity-100 bg-white/40" : "max-h-0 opacity-0"
            )}>
                <div className="p-5 sm:p-6">
                    <div className="flex gap-6 mb-6 border-b border-white/60">
                        <button onClick={() => setActiveTab('history')} className={clsx("pb-3 text-sm font-semibold transition-all flex items-center gap-2 relative", activeTab === 'history' ? "text-[#3f94ca]" : "text-slate-500 hover:text-slate-800")}>
                            <List className="w-4 h-4" /> Список документов
                            {activeTab === 'history' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#3f94ca] rounded-t-full" />}
                        </button>
                        {!isDefaultProfile && (
                            <button onClick={() => setActiveTab('dynamics')} className={clsx("pb-3 text-sm font-semibold transition-all flex items-center gap-2 relative", activeTab === 'dynamics' ? "text-[#3f94ca]" : "text-slate-500 hover:text-slate-800")}>
                                <Activity className="w-4 h-4" /> Динамика показателей
                                {activeTab === 'dynamics' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#3f94ca] rounded-t-full" />}
                            </button>
                        )}
                    </div>

                    {isLoadingData ? (
                        <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 text-[#3f94ca]/50 animate-spin" /></div>
                    ) : (
                        <>
                            {activeTab === 'history' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    {analyses.length === 0 ? (
                                        <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-slate-300">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
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
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 bg-white/80 backdrop-blur-md p-5 sm:p-7 rounded-3xl border border-white/60 shadow-sm">
                                    <PatientChart history={history} />
                                </div>
                            )}
                        </>
                    )}

                    {!isDefaultProfile && (
                        <div className="mt-8 pt-5 border-t border-white/60 flex justify-end">
                            <button 
        type="button" // Заодно добавим type, чтобы TS не ругался на саму кнопку
        onClick={() => { 
            if (confirm('Удалить пациента и все его анализы?')) {
                // 2. Передаем profile.id прямо сюда
                deleteProfileMutation.mutate(profile.id); 
            }
        }}
        disabled={deleteProfileMutation.isPending}
        className="text-xs sm:text-sm text-slate-400 hover:text-red-500 font-medium flex items-center gap-1.5 hover:bg-red-50/50 px-4 py-2 rounded-xl transition-all"
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
    
    // Наши стейты для модальных окон
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false); // <--- ДОБАВИЛИ

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

    if (isLoading) {
        return (
            <main className="relative min-h-screen flex items-center justify-center">
                <StaticBackground imageUrl="/background/legal.png" />
                <div className="relative z-10 flex flex-col items-center gap-4 bg-white/70 backdrop-blur-md p-8 rounded-3xl border border-white/40 shadow-sm">
                    <Loader2 className="w-10 h-10 text-[#3f94ca] animate-spin" />
                    <p className="text-slate-700 font-medium animate-pulse">Загрузка данных...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <StaticBackground imageUrl="/background/legal.png" />

            <div className="relative z-10 max-w-4xl mx-auto">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 tracking-tight">
                            Кабинет
                        </h1>
                        <p className="text-slate-600 mt-1 font-medium">Управление вашими документами и профилями</p>
                    </div>
                    
                    <button 
                        onClick={() => setIsUploadModalOpen(true)} 
                        className="group flex items-center justify-center gap-2 bg-gradient-to-r from-[#3f94ca] to-[#00be64] text-white px-6 py-3 rounded-2xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(63,148,202,0.3)] hover:shadow-[0_0_25px_rgba(0,190,100,0.4)] hover:-translate-y-0.5 font-semibold w-full sm:w-auto"
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
                <div className="mt-12 pt-8 border-t border-slate-300/50">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 drop-shadow-sm">Настройки аккаунта</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            // <--- ТЕПЕРЬ ОТКРЫВАЕМ МОДАЛКУ ВМЕСТО ОТПРАВКИ ПИСЬМА
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3 bg-white/70 backdrop-blur-md border border-white/40 text-slate-800 font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-sm"
                        >
                            <Key className="w-5 h-5 text-slate-500" />
                            Сменить пароль
                        </button>
                        
                        <button 
                            onClick={handleLogout}
                            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3 bg-red-50/80 backdrop-blur-md text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors shadow-sm border border-red-100/50"
                        >
                            <LogOut className="w-5 h-5 text-red-500" />
                            Выйти из системы
                        </button>
                    </div>
                </div>

                {/* --- МОДАЛЬНЫЕ ОКНА --- */}
                
                {/* Окно смены пароля */}
                {isPasswordModalOpen && (
                    <ChangePasswordModal onClose={() => setIsPasswordModalOpen(false)} />
                )}

                {/* Окно загрузки анализа */}
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative border border-white/20">
                            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-xl font-bold text-slate-900">Загрузка анализа</h3>
                                <button 
                                    onClick={() => setIsUploadModalOpen(false)} 
                                    className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1.5 shadow-sm border border-slate-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6">
                                <FileUploader /> 
                            </div>
                        </div>
                    </div>
                )}
                {/* ------------------------------- */}

            </div>
        </main>
    );
}