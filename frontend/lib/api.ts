import axios from 'axios';
import { 
    AuthResponse, 
    AnalysisResponse, 
    PatientProfile, 
    ChartData,
    Trait,            
    PatientTraitLink 
} from './types';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: { 'Content-Type': 'application/json' },
});

// Функция для безопасного получения локали (работает и на клиенте, и на сервере)
const getCurrentLocale = async () => {
    if (typeof window !== 'undefined') {
        // Мы на клиенте (в браузере)
        return document.documentElement.lang || 'en';
    } else {
        // Мы на сервере (RSC)
        try {
            // Динамический импорт нужен, чтобы не сломать клиентскую сборку
            const { getLocale } = await import('next-intl/server');
            return await getLocale();
        } catch (error) {
            return 'en'; // Фолбэк, если что-то пошло не так
        }
    }
};

// Интерсептор запросов: добавляем Токен и Язык
api.interceptors.request.use(async (config) => {
    // 1. Добавляем язык
    const locale = await getCurrentLocale();
    config.headers['Accept-Language'] = locale;

    // 2. Добавляем токен (только на клиенте, так как localStorage недоступен на сервере)
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    
    return config;
});

// Интерсептор ответов: обработка 401 и рефреш токена
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._isRetry) {
            originalRequest._isRetry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) throw new Error('Нет refresh токена');

                const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                    refresh: refreshToken
                });

                const newAccessToken = response.data.access;
                localStorage.setItem('token', newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
                
            } catch (refreshError) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user_email');
                    window.location.href = '/auth';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

const setAuthTokens = (token: string, refresh: string, email: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user_email', email);
        window.dispatchEvent(new Event('auth-change'));
    }
};

// ==========================================
// АВТОРИЗАЦИЯ
// ==========================================

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

export const requestPasswordReset = async (email: string): Promise<void> => {
    await api.post('/auth/reset-password-request', { email });
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
    });
    return response.data;
};

// ==========================================
// АНАЛИЗЫ
// ==========================================

export const uploadAnalysis = async (file: File, patientId?: number | null, isFirst: boolean = true): Promise<AnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_first', isFirst.toString()); 
    
    // Если юзер выбрал профиль, передаем его ID
    if (patientId) {
        formData.append('patient_id', patientId.toString());
    }

    const response = await api.post<AnalysisResponse>('/analyses/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const getAnalysisResult = async (uid: string): Promise<AnalysisResponse> => {
    const response = await api.get<AnalysisResponse>(`/analyses/${uid}`);
    return response.data;
};

// НОВЫЙ ЭНДПОИНТ: Пересчет анализа по новой медкарте
export const reanalyzeDocument = async (uid: string): Promise<AnalysisResponse> => {
    const response = await api.post<AnalysisResponse>(`/analyses/${uid}/reanalyze`);
    return response.data;
};

export const downloadFile = async (uid: string, filename: string) => {
    const response = await api.get(`/analyses/${uid}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 1000);
};

export const viewOriginalFile = async (uid: string): Promise<string> => {
    const response = await api.get(`/analyses/${uid}/download`, { responseType: 'blob' });
    const contentType = response.headers['content-type'];
    const blob = new Blob([response.data], { type: contentType });
    return window.URL.createObjectURL(blob);
};

export const deleteAnalysis = async (uid: string): Promise<void> => {
    await api.delete(`/analyses/${uid}`);
};

// ==========================================
// CLAIM (Привязка результатов)
// ==========================================

export const claimRequest = async (analysisUids: string[], email: string, phone?: string) => {
    const response = await api.post('/auth/claim-request', {
        analysis_uids: analysisUids,
        email,
        phone
    });
    return response.data;
};

export const claimVerify = async (
    analysisUids: string[], email: string, code: string, password: string, phone?: string
): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/claim-verify', {
        analysis_uids: analysisUids, email, phone, code, password
    });
    setAuthTokens(response.data.token, response.data.refresh_token, response.data.user_email);
    if (typeof window !== 'undefined') {
        localStorage.setItem('new_analysis_ids', JSON.stringify(analysisUids));
    }
    return response.data;
};

// ==========================================
// ПРОФИЛИ ПАЦИЕНТОВ
// ==========================================

export const getProfiles = async (): Promise<PatientProfile[]> => {
    const response = await api.get<PatientProfile[]>('/profiles');
    return response.data;
};

export async function updateProfile(
    id: number, 
    data: { 
        full_name?: string; 
        weight?: number | null; 
        height?: number | null; 
        birth_date?: string | null; 
        gender?: 'M' | 'F' | null; // <--- Меняем string на строгий тип
    }
): Promise<PatientProfile> {
    const res = await api.put(`/profiles/${id}`, data);
    return res.data;
}

export const deleteProfile = async (profileId: number): Promise<void> => {
    await api.delete(`/profiles/${profileId}`);
};

export const getPatientAnalyses = async (patientId: number): Promise<AnalysisResponse[]> => {
    const response = await api.get<AnalysisResponse[]>(`/patients/${patientId}/analyses`);
    return response.data;
};

export const getPatientHistory = async (patientId: number): Promise<ChartData[]> => {
    const response = await api.get<ChartData[]>(`/patients/${patientId}/history`);
    return response.data;
};

export async function getTraits(): Promise<Trait[]> {
    const res = await api.get('/premium/traits');
    return res.data;
}

export async function getPatientTraits(patientId: number): Promise<PatientTraitLink[]> {
    const res = await api.get(`/premium/patients/${patientId}/traits`);
    return res.data;
}

export async function linkPatientTrait(patientId: number, traitId: number, details: string): Promise<PatientTraitLink> {
    const res = await api.post(`/premium/patients/${patientId}/traits`, { trait_id: traitId, details });
    return res.data;
}

export async function removePatientTrait(linkId: number): Promise<void> {
    const res = await api.delete(`/premium/patients/traits/${linkId}`);
    return res.data;
}

export async function createCustomTrait(name: string, category: string): Promise<Trait> {
    const res = await api.post('/premium/traits/custom', { name, category });
    return res.data;
}

export const streamAnalysisChat = async (
    uid: string, 
    messages: { role: string; content: string }[],
    onChunk: (text: string) => void
): Promise<void> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const locale = typeof window !== 'undefined' ? document.documentElement.lang : 'ru';
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/analyses/${uid}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept-Language': locale || 'ru'
        },
        body: JSON.stringify({ messages })
    });

    if (!response.ok) {
        throw new Error('Chat request failed');
    }

    if (!response.body) throw new Error('ReadableStream not supported');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // SSE формат отправляет данные порциями, разделенными \n\n
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || ''; // Оставляем неполный чанк в буфере

        for (const part of parts) {
            if (part.startsWith('data: ')) {
                const dataStr = part.replace('data: ', '');
                if (dataStr === '[DONE]') {
                    return; // Конец потока
                }
                // Возвращаем переносы строк, которые мы экранировали на бэкенде
                onChunk(dataStr.replace(/\\n/g, '\n'));
            }
        }
    }
};