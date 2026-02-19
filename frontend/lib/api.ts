import axios from 'axios';

// Создаем экземпляр axios
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: { 'Content-Type': 'application/json' },
});

// --- ВАЖНО: Перехватчик запросов (Добавляет токен) ---
api.interceptors.request.use((config) => {
    // Этот код выполняется ПЕРЕД каждым запросом
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// --- Перехватчик ответов (Ловит протухший токен) ---
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    // Если сервер вернул 401 (Unauthorized), значит токен протух или неверен
    if (error.response && error.response.status === 401) {
        if (typeof window !== 'undefined') {
            // Можно разлогинить пользователя или попробовать обновить токен
            // Пока просто удалим токен и перекинем на вход
            localStorage.removeItem('token');
            localStorage.removeItem('user_email');
            window.location.href = '/auth'; 
        }
    }
    return Promise.reject(error);
});


// --- Типы данных ---

export interface PatientMetadata {
    extracted_name?: string;
    extracted_birth_date?: string;
    extracted_gender?: string;
}

export interface AIIndicator {
    name: string;
    slug?: string;
    value: string;
    unit?: string;
    ref_range?: string;
    status: 'normal' | 'low' | 'high' | 'critical';
    comment?: string;
}

export interface AICause {
    title: string;
    description: string;
}

export interface AIRecommendation {
    type: string;
    text: string;
}

export interface AISummary {
    is_critical: boolean;
    general_comment: string;
}

export interface AIResult {
    reasoning: string;
    patient_info?: PatientMetadata;
    summary: AISummary;
    indicators: AIIndicator[];
    causes: AICause[];
    recommendations: AIRecommendation[];
}

export interface AnalysisResponse {
    uid: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at: string; // Дата создания
    ai_result?: AIResult;
    patient_profile_id?: number;
}

export interface AuthResponse {
    token: string;
    user_email: string;
}

export interface PatientProfile {
    id: number;
    full_name: string;
    birth_date?: string;
    gender?: 'male' | 'female';
}

export interface ChartPoint {
    date: string;
    value: number;
    unit?: string;
    analysis_uid: string;
}

export interface ChartData {
    slug: string;
    name: string;
    data: ChartPoint[];
}


// --- API Методы ---

// 1. Загрузка
export const uploadAnalysis = async (file: File): Promise<AnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    // Для загрузки файла Content-Type должен быть multipart/form-data
    // Axios сам выставит boundary, если не задавать Content-Type вручную жестко, 
    // но лучше удалить дефолтный заголовок JSON
    const response = await api.post<AnalysisResponse>('/analyses/upload', formData, {
        headers: { 
            'Content-Type': 'multipart/form-data' 
        },
    });
    return response.data;
};

// 2. Получение результата
export const getAnalysisResult = async (uid: string): Promise<AnalysisResponse> => {
    const response = await api.get<AnalysisResponse>(`/analyses/${uid}`);
    return response.data;
};

// 3. Claim (Привязка/Регистрация)
export const claimAnalysis = async (analysisUid: string, email: string, phone?: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/claim-analysis', {
        analysis_uid: analysisUid,
        email,
        phone
    });
    return response.data;
};

// 4. Профили
export const getProfiles = async (): Promise<PatientProfile[]> => {
    const response = await api.get<PatientProfile[]>('/profiles');
    return response.data;
};

// 5. Анализы профиля
export const getPatientAnalyses = async (patientId: number): Promise<AnalysisResponse[]> => {
    const response = await api.get<AnalysisResponse[]>(`/patients/${patientId}/analyses`);
    return response.data;
};

// 6. Скачивание файла
export const downloadFile = async (uid: string, filename: string) => {
    const response = await api.get(`/analyses/${uid}/download`, {
        responseType: 'blob', // Важно для файлов
    });
    
    // Создаем ссылку в памяти браузера
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Чистим память
    link.remove();
    window.URL.revokeObjectURL(url);
};

// 7. Удаление анализа
export const deleteAnalysis = async (uid: string): Promise<void> => {
    await api.delete(`/analyses/${uid}`);
};

// 8. Получение истории (для графиков)
export const getPatientHistory = async (patientId: number): Promise<ChartData[]> => {
    const response = await api.get<ChartData[]>(`/patients/${patientId}/history`);
    return response.data;
};

export const deleteProfile = async (profileId: number): Promise<void> => {
    await api.delete(`/profiles/${profileId}`);
};

// 10. Просмотр оригинала (открывает в новой вкладке)
export const viewOriginalFile = async (uid: string) => {
    const response = await api.get(`/analyses/${uid}/download`, {
        responseType: 'blob',
    });
    
    // Получаем реальный тип файла (например, image/jpeg или application/pdf)
    const contentType = response.headers['content-type'];
    const blob = new Blob([response.data], { type: contentType });
    
    // Создаем ссылку и открываем
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Подчищаем память через 10 секунд (чтобы новая вкладка успела загрузить файл)
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
};

export const updateProfile = async (profileId: number, newName: string): Promise<PatientProfile> => {
    const response = await api.put<PatientProfile>(`/profiles/${profileId}`, { full_name: newName });
    return response.data;
};