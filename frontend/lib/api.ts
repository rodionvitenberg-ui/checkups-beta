// frontend/lib/api.ts

import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: { 'Content-Type': 'application/json' },
});

// --- Типы данных (соответствуют Pydantic схемам бэкенда) ---

export interface AIIndicator {
    name: string;
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
    summary: AISummary;
    indicators: AIIndicator[];
    causes: AICause[];
    recommendations: AIRecommendation[];
}

export interface AnalysisResponse {
    uid: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    ai_result?: AIResult; // Теперь тут строгая типизация
}

// ... функции uploadAnalysis и getAnalysisResult остаются прежними ...
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