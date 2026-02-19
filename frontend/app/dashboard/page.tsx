'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Calendar, FileText, Download, ChevronDown, 
    Plus, Loader2, ArrowRight, Trash2, Activity, List, FolderOpen, User, Eye, Edit2, Check, X
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
    ChartData
} from '@/lib/api';
import { PatientChart } from '@/components/dashboard/PatientChart';

import { pdf } from '@react-pdf/renderer';
import { AnalysisPDF } from '@/components/analysis/AnalysisPDF';

// --- Компонент Элемента Списка ---
function AnalysisItem({ analysis, onDeleteSuccess }: { analysis: AnalysisResponse, onDeleteSuccess: (uid: string) => void }) {
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [viewing, setViewing] = useState(false);
    const { toast } = useToast();

    // СКАЧИВАНИЕ ИМЕННО СГЕНЕРИРОВАННОГО ИИ PDF ОТЧЕТА (Не оригинала!)
    const handleDownloadPDF = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!analysis.ai_result) {
            toast({ title: "Внимание", description: "Данные для PDF еще не готовы", variant: "warning" });
            return;
        }

        setDownloading(true);
        try {
            const blob = await pdf(<AnalysisPDF data={analysis} />).toBlob();
            const dateStr = new Date(analysis.created_at || Date.now()).toISOString().split('T')[0];
            const name = `Checkups_Report_${dateStr}.pdf`;
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Ошибка генерации PDF:", error);
            toast({ title: "Ошибка", description: "Не удалось создать PDF", variant: "destructive" });
        } finally {
            setDownloading(false);
        }
    };

    // ОТКРЫТИЕ ОРИГИНАЛА В НОВОЙ ВКЛАДКЕ
    const handleViewOriginal = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
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
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Вы уверены, что хотите удалить этот анализ? Это действие нельзя отменить.')) return;
        
        setLoading(true);
        try {
            await deleteAnalysis(analysis.uid);
            toast({ title: "Удалено", description: "Анализ успешно удален", variant: "success" });
            onDeleteSuccess(analysis.uid);
        } catch (error) {
            toast({ title: "Ошибка", description: "Не удалось удалить анализ", variant: "destructive" });
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all mb-3 group">
            <div className="flex items-center gap-4">
                <div className={clsx(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                    analysis.status === 'completed' ? "bg-green-50 text-green-600" :
                    analysis.status === 'processing' ? "bg-yellow-50 text-yellow-600" :
                    "bg-slate-100 text-slate-500"
                )}>
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                        Анализ от {analysis.created_at ? format(new Date(analysis.created_at), 'd MMMM yyyy', { locale: ru }) : 'Неизвестная дата'}
                    </h4>
                    <span className={clsx(
                        "text-xs font-medium",
                        analysis.status === 'completed' ? "text-green-600" : "text-yellow-600"
                    )}>
                        {analysis.status === 'completed' ? 'Готов к просмотру' : 'Обработка...'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {analysis.status === 'completed' && (
                    <a 
                        href={`/analysis/${analysis.uid}`}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Открыть расшифровку"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </a>
                )}

                <button 
                    onClick={handleViewOriginal}
                    disabled={viewing}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Посмотреть оригинал бланка"
                >
                    {viewing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                </button>
                
                {analysis.status === 'completed' && (
                    <button 
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Скачать PDF отчет ИИ"
                    >
                        {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    </button>
                )}

                <button 
                    onClick={handleDelete}
                    disabled={loading}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Удалить анализ"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
}

// --- Основная страница ---
export default function DashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [profiles, setProfiles] = useState<PatientProfile[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [expandedProfileId, setExpandedProfileId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'history' | 'dynamics'>('history');
    
    // СТЕЙТЫ ДЛЯ РЕДАКТИРОВАНИЯ
    const [editingProfileId, setEditingProfileId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);

    const [analysesMap, setAnalysesMap] = useState<Record<number, AnalysisResponse[]>>({});
    const [historyMap, setHistoryMap] = useState<Record<number, ChartData[]>>({});
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const data = await getProfiles();
                const sorted = data.sort((a, b) => {
                    if (a.full_name === "Анализы" || a.full_name.includes("Основной")) return -1;
                    if (b.full_name === "Анализы" || b.full_name.includes("Основной")) return 1;
                    return 0;
                });
                setProfiles(sorted);
                if (sorted.length > 0) toggleProfile(sorted[0].id);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();
    }, []);

    const toggleProfile = async (id: number) => {
        if (editingProfileId === id) return; 

        if (expandedProfileId === id) {
            setExpandedProfileId(null);
            return;
        }

        setExpandedProfileId(id);
        setActiveTab('history'); 
        
        if (!analysesMap[id]) {
            setLoadingData(true);
            try {
                const [analyses, history] = await Promise.all([
                    getPatientAnalyses(id),
                    getPatientHistory(id)
                ]);
                setAnalysesMap(prev => ({ ...prev, [id]: analyses }));
                setHistoryMap(prev => ({ ...prev, [id]: history }));
            } catch (error) {
                toast({ title: "Ошибка", description: "Не удалось загрузить данные", variant: "destructive" });
            } finally {
                setLoadingData(false);
            }
        }
    };

    const handleSaveProfileName = async (e: React.MouseEvent, profileId: number) => {
        e.stopPropagation();
        if (!editName.trim()) return;
        
        setIsSavingName(true);
        try {
            const updated = await updateProfile(profileId, editName.trim());
            setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, full_name: updated.full_name } : p));
            setEditingProfileId(null);
            toast({ title: "Успешно", description: "Имя профиля обновлено", variant: "success" });
        } catch (error) {
            toast({ title: "Ошибка", description: "Не удалось переименовать", variant: "destructive" });
        } finally {
            setIsSavingName(false);
        }
    };

    const handleAnalysisDeleted = (profileId: number, uid: string) => {
        setAnalysesMap(prev => ({
            ...prev,
            [profileId]: prev[profileId].filter(a => a.uid !== uid)
        }));
    };

    const handleDeleteProfile = async (profileId: number) => {
        if (!confirm('Вы уверены, что хотите удалить этого пациента и все его анализы?')) return;
        try {
            await deleteProfile(profileId);
            setProfiles(prev => prev.filter(p => p.id !== profileId));
            setExpandedProfileId(null);
            toast({ title: "Удалено", description: "Профиль удален", variant: "success" });
        } catch (error) {
            toast({ title: "Ошибка", description: "Не удалось удалить профиль", variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Кабинет</h1>
                        <p className="text-slate-500">Управление документами и профилями</p>
                    </div>
                    <button 
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Загрузить анализ</span>
                    </button>
                </div>

                <div className="space-y-4">
                    {profiles.map((profile) => {
                        const isExpanded = expandedProfileId === profile.id;
                        const analyses = analysesMap[profile.id] || [];
                        const history = historyMap[profile.id] || [];
                        const isLoading = loadingData && isExpanded && analyses.length === 0;
                        
                        const isDefaultProfile = profile.full_name === "Анализы" || profile.full_name.includes("Основной");
                        const isEditingThis = editingProfileId === profile.id;

                        return (
                            <div 
                                key={profile.id} 
                                className={clsx(
                                    "bg-white rounded-2xl border transition-all duration-300 overflow-hidden",
                                    isExpanded ? "border-blue-200 shadow-md ring-1 ring-blue-100" : "border-slate-200 shadow-sm hover:border-blue-100"
                                )}
                            >
                                {/* ИСПРАВЛЕНИЕ ОШИБКИ ГИДРАТАЦИИ: заменили <button> на <div role="button"> */}
                                <div 
                                    onClick={() => toggleProfile(profile.id)}
                                    className="w-full flex items-center justify-between p-5 text-left group cursor-pointer"
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            "w-12 h-12 rounded-full flex items-center justify-center text-lg transition-colors shrink-0",
                                            isExpanded ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {isDefaultProfile ? <FolderOpen className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            {isEditingThis ? (
                                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                    <input 
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="border-b-2 border-blue-500 bg-transparent text-lg font-bold text-slate-900 focus:outline-none py-1 px-1 min-w-[200px]"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveProfileName(e as any, profile.id);
                                                            if (e.key === 'Escape') setEditingProfileId(null);
                                                        }}
                                                    />
                                                    <button 
                                                        onClick={(e) => handleSaveProfileName(e, profile.id)}
                                                        className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                                    >
                                                        {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditingProfileId(null); }}
                                                        className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-900 text-lg">
                                                        {isDefaultProfile ? 'Анализы (Без привязки)' : profile.full_name}
                                                    </h3>
                                                    {!isDefaultProfile && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingProfileId(profile.id);
                                                                setEditName(profile.full_name);
                                                            }}
                                                            className="p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Переименовать"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            <div className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                                {isDefaultProfile 
                                                    ? "Здесь хранятся анализы тех документов, где нет имени с фамилией"
                                                    : "Здесь хранятся анализы по данному пациенту"
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    {!isEditingThis && (
                                        <ChevronDown className={clsx("w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300", isExpanded && "rotate-180")} />
                                    )}
                                </div>

                                {/* CONTENT */}
                                <div className={clsx(
                                    "transition-all duration-300 ease-in-out border-t border-slate-100 bg-slate-50/50 relative",
                                    isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                                )}>
                                    <div className="p-5">
                                        
                                        <div className="flex gap-6 mb-6 border-b border-slate-200">
                                            <button 
                                                onClick={() => setActiveTab('history')}
                                                className={clsx(
                                                    "pb-2 text-sm font-medium transition-colors flex items-center gap-2",
                                                    activeTab === 'history' 
                                                        ? "border-b-2 border-blue-600 text-blue-600" 
                                                        : "text-slate-500 hover:text-slate-800"
                                                )}
                                            >
                                                <List className="w-4 h-4" /> Список документов
                                            </button>
                                            
                                            {!isDefaultProfile && (
                                                <button 
                                                    onClick={() => setActiveTab('dynamics')}
                                                    className={clsx(
                                                        "pb-2 text-sm font-medium transition-colors flex items-center gap-2",
                                                        activeTab === 'dynamics' 
                                                            ? "border-b-2 border-blue-600 text-blue-600" 
                                                            : "text-slate-500 hover:text-slate-800"
                                                    )}
                                                >
                                                    <Activity className="w-4 h-4" /> Динамика показателей
                                                </button>
                                            )}
                                        </div>

                                        {isLoading ? (
                                            <div className="py-10 flex justify-center">
                                                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                                            </div>
                                        ) : (
                                            <>
                                                {activeTab === 'history' && (
                                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                        {analyses.length === 0 ? (
                                                            <div className="text-center py-8 text-slate-400">
                                                                <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                                                <p>Пусто</p>
                                                            </div>
                                                        ) : (
                                                            analyses.map(analysis => (
                                                                <AnalysisItem 
                                                                    key={analysis.uid} 
                                                                    analysis={analysis} 
                                                                    onDeleteSuccess={(uid) => handleAnalysisDeleted(profile.id, uid)}
                                                                />
                                                            ))
                                                        )}
                                                    </div>
                                                )}

                                                {activeTab === 'dynamics' && !isDefaultProfile && (
                                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                        <PatientChart history={history} />
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {!isDefaultProfile && (
                                            <div className="mt-8 pt-4 border-t border-red-50 flex justify-end">
                                                <button 
                                                    onClick={() => handleDeleteProfile(profile.id)}
                                                    className="text-xs sm:text-sm text-red-500 font-medium flex items-center gap-1.5 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Удалить пациента
                                                </button>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}