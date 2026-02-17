import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: { 'Content-Type': 'application/json' },
});

// --- Типы данных ---

export interface PatientMetadata {
    extracted_name?: string;
    extracted_birth_date?: string;
    extracted_gender?: string;
}

export interface AIIndicator {
    name: string;
    slug?: string; // <-- Новое поле для графиков
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
    reasoning: string; // <-- Новое поле (Chain-of-Thought)
    patient_info?: PatientMetadata; // <-- Данные о пациенте с бланка
    summary: AISummary;
    indicators: AIIndicator[];
    causes: AICause[];
    recommendations: AIRecommendation[];
}

export interface AnalysisResponse {
    uid: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    ai_result?: AIResult;
    patient_profile_id?: number; // <-- ID профиля, если привязан
}

export interface AuthResponse {
    token: string;
    user_email: string;
}

// --- API Методы ---

export const uploadAnalysis = async (file: File): Promise<AnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<AnalysisResponse>('/analyses/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const getAnalysisResult = async (uid: string): Promise<AnalysisResponse> => {
    const response = await api.get<AnalysisResponse>(`/analyses/${uid}`);
    return response.data;
};

export const claimAnalysis = async (analysisUid: string, email: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/claim-analysis', {
        analysis_uid: analysisUid,
        email: email
    });
    return response.data;
};