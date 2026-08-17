import { create } from 'zustand';

// Твой старый объект (оставляем как есть, чтобы не сломать FileUploader)
export const sharedFileStore = {
    files: [] as File[]
};

// Наш новый глобальный стейт для приложения
interface AppState {
    isPaywallOpen: boolean;
    isPro: boolean;
    proExpiresAt: string | null;
    setPaywallOpen: (isOpen: boolean) => void;
    setProStatus: (isPro: boolean, proExpiresAt: string | null) => void;
}

// Инициализация из localStorage (если токен есть, статус PRO уже сохранён)
const getInitialIsPro = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('is_pro') === '1';
};

export const useStore = create<AppState>((set) => ({
    isPaywallOpen: false,
    isPro: getInitialIsPro(),
    proExpiresAt: null,
    setPaywallOpen: (isOpen) => set({ isPaywallOpen: isOpen }),
    setProStatus: (isPro, proExpiresAt) => set({ isPro, proExpiresAt }),
}));
