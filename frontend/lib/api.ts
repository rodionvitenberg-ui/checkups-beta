import axios from 'axios';

export interface AuthResponse {
    token: string;
    refresh_token: string; 
    user_email: string;
}

// Создаем экземпляр axios
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: { 'Content-Type': 'application/json' },
});

// 1. Интерцептор запросов: автоматически прикрепляем access-токен ко всем запросам
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// 2. Интерцептор ответов: отлавливаем 401 ошибку и незаметно обновляем токен
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Если ошибка 401 (Unauthorized) и мы еще не пробовали рефрешнуть токен (_isRetry - наш кастомный флаг)
        if (error.response?.status === 401 && !originalRequest._isRetry) {
            originalRequest._isRetry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) throw new Error('Нет refresh токена');

                // Делаем запрос за новым токеном (используем чистый axios, чтобы не зациклить интерцепторы!)
                const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                    refresh: refreshToken
                });

                const newAccessToken = response.data.access;
                
                // Сохраняем новый access-токен
                localStorage.setItem('token', newAccessToken);
                
                // Повторяем оригинальный запрос уже с новым токеном
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
                
            } catch (refreshError) {
                // Если refresh-токен тоже протух — разлогиниваем пользователя
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user_email');
                    window.location.href = '/auth'; // Принудительный редирект на логин
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// --- Типы данных ---

export interface PatientMetadata {
    extracted_name?: string;
    extracted_birth_date?: string;
    extracted_gender?: string;
    extracted_date?: string;
}

export interface AIIndicator {
    name: string;
    slug?: string;
    value: string;
    unit?: string;
    ref_range?: string;
    status: 'normal' | 'low' | 'high' | 'critical';
    comment?: string;
    category?: string;
}

export interface AICause {
    title: string;
    description: string;
    severity?: 'green' | 'yellow' | 'red';
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


// ДОБАВЛЯЕМ ФУНКЦИЮ-ХЕЛПЕР
const setAuthTokens = (token: string, refresh: string, email: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user_email', email);
        // Запускаем событие, чтобы Header моментально перерисовался
        window.dispatchEvent(new Event('auth-change'));
    }
};

// ОБНОВЛЯЕМ МЕТОДЫ АВТОРИЗАЦИИ
export const login = async (data: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    setAuthTokens(response.data.token, response.data.refresh_token, response.data.user_email);
    return response.data;
};

export const register = async (data: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    setAuthTokens(response.data.token, response.data.refresh_token, response.data.user_email);
    return response.data;
};

// ВОТ ОНА — НАША НОВАЯ ФУНКЦИЯ ДЛЯ СМЕНЫ ПАРОЛЯ
export const requestPasswordReset = async (email: string): Promise<void> => {
    await api.post('/auth/reset-password-request', { email });
};

// 1. Загрузка
export const uploadAnalysis = async (file: File, isFirst: boolean = true): Promise<AnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    // Добавляем флаг, чтобы бэкенд знал, нужно ли запускать ИИ сразу
    formData.append('is_first', isFirst.toString()); 

    const response = await api.post<AnalysisResponse>('/analyses/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
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
export const claimRequest = async (analysisUids: string[], email: string, phone?: string) => {
    const response = await api.post('/auth/claim-request', {
        analysis_uids: analysisUids,
        email,
        phone
    });
    return response.data;
};

export const claimVerify = async (
    analysisUids: string[], 
    email: string, 
    code: string, 
    password: string, 
    phone?: string
): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/claim-verify', {
        analysis_uids: analysisUids,
        email,
        phone,
        code,
        password
    });
    setAuthTokens(response.data.token, response.data.refresh_token, response.data.user_email);
    
    // МЕТКА NEW: Сохраняем новые ID в локальное хранилище для сайдбара
    if (typeof window !== 'undefined') {
        localStorage.setItem('new_analysis_ids', JSON.stringify(analysisUids));
    }
    
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
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    
    // Safari fix: убеждаемся, что элемент в DOM, но невидим
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Safari fix: задержка перед удалением, чтобы браузер успел подхватить файл
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 1000);
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
export const viewOriginalFile = async (uid: string): Promise<string> => {
    const response = await api.get(`/analyses/${uid}/download`, {
        responseType: 'blob',
    });
    
    // Получаем реальный тип файла (например, image/jpeg или application/pdf)
    const contentType = response.headers['content-type'];
    const blob = new Blob([response.data], { type: contentType });
    
    // Возвращаем Blob URL, а НЕ открываем окно здесь
    return window.URL.createObjectURL(blob);
};

export const updateProfile = async (profileId: number, newName: string): Promise<PatientProfile> => {
    const response = await api.put<PatientProfile>(`/profiles/${profileId}`, { full_name: newName });
    return response.data;
};

export interface FAQItem {
    id: number;
    question: string;
    answer: string;
}

// Получение списка вопросов из нашей новой CMS
export const getFaqs = async (): Promise<FAQItem[]> => {
    // Обращаемся к роутеру CMS, который мы добавили в Django
    const response = await api.get<FAQItem[]>('/cms/faq');
    return response.data;
};

export interface ContentBlock {
    slug: string;
    title: string;
    content: string;
    image: string | null;
}

export const getBlocks = async (): Promise<ContentBlock[]> => {
    const response = await api.get<ContentBlock[]>('/cms/blocks');
    return response.data;
};

export interface Testimonial {
    id: number;
    name: string;
    text: string;
    avatar: string | null;
}

export const getTestimonials = async (): Promise<Testimonial[]> => {
    const response = await api.get<Testimonial[]>('/cms/testimonials');
    return response.data;
};

export const createTestimonial = async (formData: FormData): Promise<Testimonial> => {
    const response = await api.post<Testimonial>('/cms/testimonials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export interface LegalDocument {
    slug: string;
    title: string;
    content: string;
    updated_at: string;
}

export const getLegalDocuments = async (): Promise<LegalDocument[]> => {
    const response = await api.get<LegalDocument[]>('/cms/legal');
    return response.data;
};

